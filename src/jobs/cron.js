const cron = require('node-cron');
const fs = require('fs');
const db = require('../database/connection').getConnection();
const VideoTask = require('../models/video.model');
const { processLocalVideoUpload } = require('../services/handle-upload.service');
const Log = require('../models/log.model');
const Thread = require('../models/thread.model');
const Config = require('../models/config.model');

// Helper tự động đổi sang Proxy sống mới khi phát hiện Proxy cũ chết hoặc bị chặn
async function rotateThreadProxy(threadId, reason = '') {
  return new Promise((resolve) => {
    db.all("SELECT proxy FROM proxies ORDER BY RANDOM() LIMIT 5", [], (err, rows) => {
      if (err || !rows || rows.length === 0) return resolve(null);
      const chosen = rows[0].proxy;
      const parts = chosen.split(':');
      if (parts.length >= 2) {
        const host = parts[0].trim();
        const port = parseInt(parts[1].trim(), 10);
        const user = parts.length === 4 ? parts[2].trim() : null;
        const pass = parts.length === 4 ? parts[3].trim() : null;
        db.run(
          "UPDATE threads SET proxy_host = ?, proxy_port = ?, proxy_username = ?, proxy_password = ?, error = NULL WHERE id = ?",
          [host, port, user, pass, threadId],
          (uErr) => {
            if (!uErr) {
              console.log(`🔄 [Auto-Proxy] Luồng #${threadId} đã tự đổi sang proxy mới: ${host}:${port} (Lý do: ${reason})`);
              // Đồng bộ lưu proxy mới này vào bảng users để các phiên làm việc sau vẫn dùng proxy này
              db.run(
                "UPDATE users SET proxy = ? WHERE id = (SELECT user_id FROM threads WHERE id = ?)",
                [chosen, threadId]
              );
            }
            resolve(chosen);
          }
        );
      } else {
        resolve(null);
      }
    });
  });
}

function parseProxyHelper(thread) {
  const parseScheme = (p) => {
    if (!p) return { scheme: 'http', rest: '' };
    for (const prefix of ['socks5h://', 'socks5://', 'socks4://', 'http://', 'https://']) {
      if (String(p).toLowerCase().startsWith(prefix)) {
        return { scheme: prefix.replace('://', ''), rest: String(p).slice(prefix.length) };
      }
    }
    return { scheme: 'http', rest: String(p) };
  };

  if (thread.proxy_host && thread.proxy_port) {
    const { scheme, rest } = parseScheme(thread.proxy_host);
    const pObj = { host: rest, port: thread.proxy_port, scheme };
    if (thread.proxy_username && thread.proxy_password) {
      pObj.auth = { username: thread.proxy_username, password: thread.proxy_password };
    }
    return pObj;
  }
  if (thread.user_proxy) {
    const { scheme, rest } = parseScheme(thread.user_proxy);
    const parts = rest.split(':');
    if (parts.length >= 2) {
      const pObj = { host: parts[0], port: parseInt(parts[1]), scheme };
      if (parts.length === 4) {
        pObj.auth = { username: parts[2], password: parts[3] };
      }
      return pObj;
    }
  }
  return null;
}

const initJobs = () => {
  const activeThreadIds = new Set();
  const consecutiveFailures = new Map();
  let maxConcurrent = 60;

  const updateDynamicConcurrency = () => {
    db.get("SELECT COUNT(*) as count FROM proxies", [], (err, row) => {
      if (!err && row && row.count > 0) {
        maxConcurrent = row.count * 2;
      } else {
        maxConcurrent = 20;
      }
    });
  };

  updateDynamicConcurrency();
  setInterval(updateDynamicConcurrency, 30000);

  const cleanStuckUploadingTasks = () => {
    db.run(
      `UPDATE video_tasks 
       SET status = 'failed', error = 'Kẹt upload quá 5 phút (tự động bỏ qua)' 
       WHERE status = 'uploading' AND (strftime('%s', 'now', 'localtime') - strftime('%s', created_at)) > 300`,
      () => {}
    );
  };
  cleanStuckUploadingTasks();
  setInterval(cleanStuckUploadingTasks, 15000);

  async function executeThread(t) {
    try {
      if (t.count_video_upload > 0 && t.videos_uploaded >= t.count_video_upload) {
        await new Promise((res) => db.run("UPDATE threads SET status = 'done' WHERE id = ?", [t.id], () => res()));
        return;
      }

      const threadCheck = await new Promise((res) =>
        db.get("SELECT status FROM threads WHERE id = ?", [t.id], (err, row) => res(row))
      );
      if (!threadCheck || threadCheck.status !== 'inprogress') return;

      let task = null;
      while (true) {
        const nextTask = await VideoTask.getNextPendingForUser(t.user_id);
        if (!nextTask) break;

        if (!nextTask.video_path || !fs.existsSync(nextTask.video_path)) {
          await VideoTask.updateStatus(nextTask.id, 'failed', { error: 'File video không tồn tại trên ổ đĩa (đã xóa)' });
          continue;
        }

        task = nextTask;
        break;
      }

      if (!task) {
        await new Promise((res) => db.run("UPDATE threads SET status = 'done', error = NULL WHERE id = ?", [t.id], () => res()));
        return;
      }

      await VideoTask.updateStatus(task.id, 'uploading');
      const proxyObj = parseProxyHelper(t);

      console.log(`🚀 [Upload] Luồng #${t.id} (${t.username}): Bắt đầu upload video "${task.video_filename}"...`);

      try {
        const result = await processLocalVideoUpload(task.video_path, {
          cookie: t.cookie,
          proxy: proxyObj,
          caption: task.caption,
          products: task.products,
          country: t.country || 'vn'
        });

        console.log(`✅ [Thành công] Luồng #${t.id} (${t.username}): Đã đăng video thành công! Post ID: ${result.postId}`);

        consecutiveFailures.delete(t.id);
        await new Promise((res) => db.run("UPDATE threads SET error = NULL WHERE id = ?", [t.id], () => res()));

        const minDelay = t.delay_min || 60;
        const maxDelay = t.delay_max || 180;
        const randomDelay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
        const nextRunTime = Math.floor(Date.now() / 1000) + randomDelay;

        await Promise.all([
          VideoTask.updateStatus(task.id, 'completed', {
            post_id: result.postId,
            video_link: result.videoLink
          }),
          Log.create({
            username: t.username,
            status: 'success',
            post_id: result.postId,
            extra_info: JSON.stringify({ video: task.video_filename, link: result.videoLink })
          }),
          new Promise((res) => {
            db.run(
              "UPDATE threads SET videos_uploaded = videos_uploaded + 1, next_run_at = ? WHERE id = ?",
              [nextRunTime, t.id],
              () => {
                if (t.count_video_upload > 0 && (t.videos_uploaded + 1) >= t.count_video_upload) {
                  db.run("UPDATE threads SET status = 'done' WHERE id = ?", [t.id], () => res());
                } else {
                  res();
                }
              }
            );
          })
        ]);
      } catch (uploadErr) {
        let errMsg = uploadErr?.error || uploadErr?.message || 'Unknown error';
        console.warn(`⚠️ [Thất bại] Luồng #${t.id} (${t.username}): ${errMsg}`);
        if (typeof errMsg === 'string') {
          if (errMsg.includes('<!DOCTYPE') || errMsg.includes('<html')) {
            errMsg = 'Credit API server không phản hồi — kiểm tra kết nối';
          }
          errMsg = errMsg.substring(0, 200);
        }
        const lowerErr = (typeof errMsg === 'string' ? errMsg : '').toLowerCase();

        const isPostLimitReached = 
          lowerErr.includes('post too many videos') || 
          lowerErr.includes('have a rest') || 
          lowerErr.includes('too many videos') ||
          lowerErr.includes('frequently');

        if (isPostLimitReached) {
          console.log(`[Shopee-Limit] Tài khoản ${t.username} (Luồng #${t.id}) đã bị Shopee giới hạn số lượng video trong ngày -> Tự động dừng luồng.`);
          consecutiveFailures.delete(t.id);
          await Promise.all([
            VideoTask.updateStatus(task.id, 'failed', { error: 'Shopee giới hạn: Post too many videos, please have a rest' }),
            Log.create({
              username: t.username,
              status: 'error',
              error: `[Tự Động Dừng Luồng] Đã đạt giới hạn đăng video của Shopee trong ngày (${errMsg})`,
              failed_function: 'createPost'
            }),
            new Promise((res) =>
              db.run(
                "UPDATE threads SET status = 'stop', error = ? WHERE id = ?",
                ['Shopee giới hạn: Post too many videos (Đã dừng luồng)', t.id],
                () => res()
              )
            )
          ]);
          return;
        }

        const isFileError = 
          errMsg.includes('ENOENT') || 
          errMsg.includes('no such file') || 
          errMsg.includes('File video không tồn tại') || 
          errMsg.includes('không tồn tại hoặc rỗng');

        let autoChanged = false;
        let delayAfterError = 30;

        if (isFileError) {
          delayAfterError = 5;
        } else {
          const isProxyError = 
            errMsg.includes('ECONNREFUSED') ||
            errMsg.includes('ETIMEDOUT') ||
            errMsg.includes('ECONNRESET') ||
            errMsg.includes('EHOSTUNREACH') ||
            errMsg.includes('ENOTFOUND') ||
            errMsg.includes('407') ||
            errMsg.includes('không kết nối được') ||
            errMsg.includes('Empty token response') ||
            errMsg.includes('getToken failed') ||
            errMsg.includes('getUploadInfo failed') ||
            errMsg.includes('socket hang up') ||
            errMsg.includes('Proxy connection timed out') ||
            errMsg.includes('ERR_BAD_REQUEST');

          if (isProxyError) {
            const newProxy = await rotateThreadProxy(t.id, errMsg);
            if (newProxy) {
              autoChanged = true;
              delayAfterError = 5;
              consecutiveFailures.delete(t.id);
            }
          } else {
            const fails = (consecutiveFailures.get(t.id) || 0) + 1;
            consecutiveFailures.set(t.id, fails);
            if (fails >= 2) {
              const newProxy = await rotateThreadProxy(t.id, `Lỗi lặp lại ${fails} lần: ${errMsg}`);
              if (newProxy) {
                autoChanged = true;
                delayAfterError = 5;
                consecutiveFailures.delete(t.id);
              }
            }
          }
        }

        const nextRetryTime = Math.floor(Date.now() / 1000) + delayAfterError;

        await Promise.all([
          VideoTask.updateStatus(task.id, 'failed', { error: errMsg }),
          Log.create({
            username: t.username,
            status: 'error',
            error: autoChanged ? `[Tự Đổi Proxy Sống Mới] ${errMsg}` : errMsg,
            failed_function: uploadErr?.failedFunction || 'uploadShopeeVideo'
          }),
          new Promise((res) =>
            db.run(
              "UPDATE threads SET error = ?, next_run_at = ? WHERE id = ?",
              [autoChanged ? null : errMsg, nextRetryTime, t.id],
              () => res()
            )
          )
        ]);
      }
    } catch (thErr) {
      console.error(`[cron] Luồng #${t.id} gặp lỗi:`, thErr);
    } finally {
      activeThreadIds.delete(t.id);
    }
  }

  let isChecking = false;
  async function checkQueue() {
    if (isChecking) return;
    isChecking = true;
    try {
      const nowSec = Math.floor(Date.now() / 1000);
      const availableSlots = maxConcurrent - activeThreadIds.size;
      if (availableSlots > 0) {
        const threads = await new Promise((resolve) => {
          db.all(
            `SELECT threads.*, users.cookie, users.username, users.proxy AS user_proxy
             FROM threads
             INNER JOIN users ON threads.user_id = users.id
             WHERE threads.status = 'inprogress'`,
            [],
            (err, rows) => resolve(rows || [])
          );
        });

        const runnableThreads = (threads || []).filter(
          t => (t.next_run_at || 0) <= nowSec && !activeThreadIds.has(t.id)
        );

        if (runnableThreads.length > 0) {
          const toRun = runnableThreads.slice(0, availableSlots);
          for (let i = 0; i < toRun.length; i++) {
            const t = toRun[i];
            activeThreadIds.add(t.id);
            executeThread(t);
            await new Promise(r => setTimeout(r, 60));
          }
        }
      }
    } catch (err) {
      console.error('[cron] Queue check error:', err);
    } finally {
      isChecking = false;
      setTimeout(checkQueue, 2000);
    }
  }

  // Khởi động vòng lặp kiểm tra hàng đợi
  setTimeout(checkQueue, 2000);

  // Tự động reset và kích hoạt chạy lại tất cả luồng theo lịch cấu hình
  cron.schedule('* * * * *', async () => {
    try {
      const resetTime = await Config.getRunningTimeAgain();
      if (!resetTime) return;
      const d = new Date();
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      const currentTime = `${hh}:${mm}`;

      if (currentTime === resetTime.trim()) {
        console.log(`⏰ [Hẹn Giờ Auto] Đã đến ${resetTime} -> Tự động khởi động và kích hoạt toàn bộ luồng đăng video!`);
        await Thread.resetAllToInprogressThreads();
      }
    } catch (e) {
      console.error('[cron] Error restarting threads:', e);
    }
  });
};

module.exports = { initJobs };