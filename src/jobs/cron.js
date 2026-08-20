
const { exec } = require('child_process');
setInterval(() => {
  exec('adb forward tcp:8080 tcp:8080', () => {});
}, 10000);
exec('adb forward tcp:8080 tcp:8080', () => {});
const cron = require('node-cron');
const db = require('../database/connection').getConnection();
const VideoTask = require('../models/video.model');
const { processLocalVideoUpload } = require('../services/handle-upload.service');
const Log = require('../models/log.model');
const Thread = require('../models/thread.model');
const Config = require('../models/config.model');

// Helper thay đổi Proxy ngẫu nhiên từ Database khi gặp lỗi mạng/token/proxy
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
          "UPDATE threads SET proxy_host = ?, proxy_port = ?, proxy_username = ?, proxy_password = ? WHERE id = ?",
          [host, port, user, pass, threadId],
          (uErr) => {
            if (!uErr) {
              console.log(`🔄 [Auto-Proxy] Luồng #${threadId} đã tự đổi sang proxy mới: ${host}:${port} (Lý do: ${reason})`);
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
  let isRunning = false;

  // Lặp kiểm tra và chạy upload mỗi 5 giây
  setInterval(async () => {
    if (isRunning) return;
    isRunning = true;

    try {
      const nowSec = Math.floor(Date.now() / 1000);

      // Lấy danh sách các luồng đang chạy
      const threads = await new Promise((resolve, reject) => {
        db.all(
          `SELECT threads.*, users.cookie, users.username, users.proxy AS user_proxy
           FROM threads
           INNER JOIN users ON threads.user_id = users.id
           WHERE threads.status = 'inprogress'`,
          [],
          (err, rows) => err ? reject(err) : resolve(rows || [])
        );
      });

      // Lọc các luồng đã đến thời gian chạy (next_run_at <= now)
      const runnableThreads = threads.filter(t => (t.next_run_at || 0) <= nowSec);
      if (runnableThreads.length === 0) return;

      await Promise.all(runnableThreads.map(async (t) => {
        // Kiểm tra giới hạn số lượng video của luồng
        if (t.count_video_upload > 0 && t.videos_uploaded >= t.count_video_upload) {
          await new Promise((res, rej) =>
            db.run("UPDATE threads SET status = 'done' WHERE id = ?", [t.id], err => err ? rej(err) : res())
          );
          return;
        }

        // Kiểm tra lại trạng thái luồng trong DB
        const threadCheck = await new Promise((res, rej) =>
          db.get("SELECT status FROM threads WHERE id = ?", [t.id], (err, row) => err ? rej(err) : res(row))
        );
        if (!threadCheck || threadCheck.status !== 'inprogress') return;

        // Lấy task pending tiếp theo của tài khoản
        const task = await VideoTask.getNextPendingForUser(t.user_id);
        if (!task) {
          await new Promise((res, rej) =>
            db.run("UPDATE threads SET status = 'done' WHERE id = ?", [t.id], err => err ? rej(err) : res())
          );
          return;
        }

        // Đánh dấu task đang upload
        await VideoTask.updateStatus(task.id, 'uploading');

        // Phân tích proxy
        const proxyObj = parseProxyHelper(t);

        try {
          // Xử lý upload video
          const result = await processLocalVideoUpload(task.video_path, {
            cookie: t.cookie,
            proxy: proxyObj,
            caption: task.caption,
            products: task.products,
            country: t.country || 'vn'
          });

          // Xóa lỗi cũ của luồng
          await new Promise((res, rej) =>
            db.run("UPDATE threads SET error = NULL WHERE id = ?", [t.id], err => err ? rej(err) : res())
          );

          // Cập nhật kết quả thành công
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
            new Promise((res, rej) => {
              db.run(
                "UPDATE threads SET videos_uploaded = videos_uploaded + 1, next_run_at = ? WHERE id = ?",
                [nextRunTime, t.id],
                (err) => {
                  if (err) return rej(err);
                  if (t.count_video_upload > 0 && (t.videos_uploaded + 1) >= t.count_video_upload) {
                    db.run("UPDATE threads SET status = 'done' WHERE id = ?", [t.id], (err2) => {
                      if (err2) return rej(err2);
                      res();
                    });
                  } else {
                    res();
                  }
                }
              );
            })
          ]);
        } catch (uploadErr) {
          let errMsg = uploadErr?.error || uploadErr?.message || 'Unknown error';
          if (typeof errMsg === 'string') {
            if (errMsg.includes('<!DOCTYPE') || errMsg.includes('<html')) {
              errMsg = 'Credit API server không phản hồi — kiểm tra kết nối';
            }
            errMsg = errMsg.substring(0, 200);
          }

          // === TỰ ĐỘNG THAY PROXY KHI GẶP LỖI TOKEN HOẶC LỖI MẠNG PROXY ===
          const isTokenOrProxyError = 
            errMsg.includes('Empty token') ||
            errMsg.includes('getToken') ||
            errMsg.includes('ECONNRESET') ||
            errMsg.includes('ECONNREFUSED') ||
            errMsg.includes('ETIMEDOUT') ||
            errMsg.includes('proxy quá chậm') ||
            errMsg.includes('418');

          let delayAfterError = 30; // Mặc định chờ 30s sau khi lỗi

          if (isTokenOrProxyError) {
            // Lập tức thay đổi proxy sang IP mới từ Database
            await rotateThreadProxy(t.id, errMsg);
            // Giảm thời gian chờ xuống 8 giây để luồng thử lại ngay với proxy mới
            delayAfterError = 8;
          }

          const nextRetryTime = Math.floor(Date.now() / 1000) + delayAfterError;

          await Promise.all([
            VideoTask.updateStatus(task.id, 'failed', { error: errMsg }),
            Log.create({
              username: t.username,
              status: 'error',
              error: isTokenOrProxyError ? `[Auto-Proxy Đổi IP] ${errMsg}` : errMsg,
              failed_function: uploadErr?.failedFunction || 'uploadShopeeVideo'
            }),
            new Promise((res, rej) =>
              db.run("UPDATE threads SET error = ?, next_run_at = ? WHERE id = ?", [errMsg, nextRetryTime, t.id], err => err ? rej(err) : res())
            )
          ]);
        }
      }));
    } catch (jobErr) {
      console.error('[cron] Job error:', jobErr);
    } finally {
      isRunning = false;
    }
  }, 5000);

  // Tự động reset tất cả luồng theo lịch cấu hình
  cron.schedule('* * * * *', async () => {
    try {
      const resetTime = await Config.getRunningTimeAgain();
      const currentTime = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
      if (currentTime === resetTime) {
        await Thread.resetAllToInprogressThreads();
        console.log('[cron] All threads reset to inprogress');
      }
    } catch (e) {
      console.error('[cron] Error restarting threads:', e);
    }
  });
};

module.exports = { initJobs };