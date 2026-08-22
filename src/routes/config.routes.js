const express = require('express');
const router = express.Router();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const Config = require('../models/config.model');
const adbService = require('../services/adb.service');
const { HttpsProxyAgent } = require('https-proxy-agent');
const db = require('../database/connection').getConnection();

// Create proxies table on startup
db.run(`
  CREATE TABLE IF NOT EXISTS proxies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    proxy TEXT UNIQUE NOT NULL,
    ping INTEGER,
    created_at DATETIME DEFAULT (datetime('now', 'localtime'))
  )
`, (err) => {
  if (err) console.error('Error creating proxies table:', err);
});

// Add delete_video_on_success column to config if not exists
db.run(`ALTER TABLE config ADD COLUMN delete_video_on_success INTEGER DEFAULT 0`, (err) => {});
db.run(`ALTER TABLE config ADD COLUMN use_proxy_queue_lock INTEGER DEFAULT 1`, (err) => {});

// Add video_deleted column to video_tasks if not exists (to track cleaned up files)
db.run(`ALTER TABLE video_tasks ADD COLUMN video_deleted INTEGER DEFAULT 0`, (err) => {
  if (err && !err.message.includes('duplicate column')) {
    console.error('Error adding video_deleted column:', err);
  }
});

// GET /api/config/proxy-queue-lock
router.get('/proxy-queue-lock', async (req, res) => {
  try {
    const enabled = await Config.getUseProxyQueueLock();
    res.json({ enabled: enabled === 1 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/config/proxy-queue-lock
router.post('/proxy-queue-lock', async (req, res) => {
  try {
    const { enabled } = req.body;
    const val = await Config.updateUseProxyQueueLock(enabled);
    res.json({ success: true, enabled: val === 1, message: 'Đã cập nhật cài đặt Proxy Queue Lock' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/config/running-time-again
router.get('/running-time-again', async (req, res) => {
  try {
    const runningTime = await Config.getRunningTimeAgain();
    res.json({ runningTimeAgain: runningTime });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/config/running-time-again
router.post('/running-time-again', async (req, res) => {
  try {
    const { runningTimeAgain } = req.body;
    await Config.updateRunningTimeAgain(runningTimeAgain);
    res.json({ success: true, message: 'Lưu thời gian chạy lại thành công' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/config/crawler-cookies
router.get('/crawler-cookies', async (req, res) => {
  try {
    const cookies = await Config.getAllCookies();
    res.json({ cookies: cookies || [] });
  } catch (err) {
    console.error('Error getting crawler cookies:', err);
    res.status(500).json({ success: false, message: 'Lỗi khi lấy cookies' });
  }
});

// POST /api/config/crawler-cookies
router.post('/crawler-cookies', async (req, res) => {
  try {
    const { cookies } = req.body;
    if (!cookies || !Array.isArray(cookies) || cookies.length === 0) {
      return res.status(400).json({ success: false, message: 'Danh sách cookies không hợp lệ' });
    }
    const validCookies = cookies.filter(c => c && c.trim() !== '');
    if (validCookies.length === 0) {
      return res.status(400).json({ success: false, message: 'Không có cookie hợp lệ' });
    }
    await Config.updateAllCookies(validCookies);
    res.json({ success: true, message: 'Lưu cookies thành công' });
  } catch (err) {
    console.error('Lỗi khi lưu cookies:', err);
    res.status(500).json({ success: false, message: 'Lỗi khi lưu cookies' });
  }
});

// GET /api/config/credit
router.get('/credit', async (req, res) => {
  try {
    const settings = await Config.getCreditSettings();
    res.json({
      sign_mode: settings.sign_mode || 'credit',
      credit_url: settings.raw_credit_url || settings.credit_url,
      credit_key: settings.raw_credit_key || settings.credit_key,
      phone_sign_url: settings.phone_sign_url || 'http://127.0.0.1:8080',
      phone_sign_key: settings.phone_sign_key || 'secret_key'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/config/credit
router.post('/credit', async (req, res) => {
  try {
    const { credit_url, credit_key, sign_mode = 'credit', phone_sign_url, phone_sign_key } = req.body;
    if (sign_mode === 'credit' && (!credit_url || !credit_key)) {
      return res.status(400).json({ success: false, message: 'URL và Key Credit không được để trống' });
    }
    if (sign_mode === 'phone' && !phone_sign_url) {
      return res.status(400).json({ success: false, message: 'URL Phone Sign không được để trống' });
    }
    await Config.updateCreditSettings(
      credit_url || '',
      credit_key || '',
      sign_mode,
      phone_sign_url || 'http://127.0.0.1:8080',
      phone_sign_key || 'secret_key'
    );
    res.json({ success: true, message: 'Lưu cài đặt ký số thành công' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/config/phone-sign-check
router.post('/phone-sign-check', async (req, res) => {
  try {
    const { phone_sign_url, phone_sign_key } = req.body;
    const targetUrl = (phone_sign_url || 'http://127.0.0.1:8080').trim().replace(/\/+$/, '') + '/';
    const testBody = {
      url: '/api/v2/biz/post/precheck',
      body: '{}',
      key: phone_sign_key || 'secret_key'
    };
    const startTime = Date.now();
    const response = await axios.post(targetUrl, testBody, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': phone_sign_key || 'secret_key'
      },
      timeout: 5000
    });
    const latency = Date.now() - startTime;
    if (response.data?.code === 0 && response.data?.data?.['X-Sap-Access-S']) {
      return res.json({
        success: true,
        latency,
        data: response.data.data
      });
    }
    res.json({
      success: false,
      error: response.data?.msg || 'Server phản hồi nhưng không có chữ ký hợp lệ'
    });
  } catch (err) {
    res.json({
      success: false,
      error: err.message || 'Không thể kết nối đến Phone Sign Server'
    });
  }
});

// GET /api/config/adb/devices
router.get('/adb/devices', async (req, res) => {
  try {
    const devices = await adbService.getDevices();
    const forwards = await adbService.getForwardList();
    res.json({
      success: true,
      devices,
      forwards
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/config/adb/forward
router.post('/adb/forward', async (req, res) => {
  try {
    const { serial, port = 8080 } = req.body;
    if (!serial) {
      return res.status(400).json({ success: false, message: 'Chưa chọn thiết bị' });
    }
    const output = await adbService.forwardPort(serial, port, port);
    res.json({
      success: true,
      message: `Đã chuyển tiếp cổng ${port} từ thiết bị [${serial}] sang PC thành công!`,
      output
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Lỗi khi forward port qua ADB' });
  }
});

// GET /api/config/blacklist
router.get('/blacklist', async (req, res) => {
  try {
    const keywords = await Config.getBlacklistKeywords();
    res.json({ blacklist_keywords: keywords });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/config/blacklist
router.post('/blacklist', async (req, res) => {
  try {
    const { blacklist_keywords } = req.body;
    await Config.updateBlacklistKeywords(blacklist_keywords || '');
    res.json({ success: true, message: 'Lưu từ khoá blacklist thành công' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/config/api-url-key1
router.get('/api-url-key1', async (req, res) => {
  try {
    const apiUrlKey1 = await Config.getApiUrlKey1();
    res.json({ api_url_key1: apiUrlKey1 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/config/api-url-key1
router.post('/api-url-key1', async (req, res) => {
  try {
    const { api_url_key1 } = req.body;
    await Config.updateApiUrlKey1(api_url_key1);
    res.json({ success: true, message: 'Lưu API URL Key 1 thành công' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/config/is-aigc
router.get('/is-aigc', async (req, res) => {
  try {
    const isAigc = await Config.getIsAigc();
    res.json({ is_aigc: isAigc });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/config/is-aigc
router.post('/is-aigc', async (req, res) => {
  try {
    const { is_aigc } = req.body;
    await Config.updateIsAigc(!!is_aigc);
    res.json({ success: true, message: 'Đã lưu cài đặt AIGC' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/config/credit-balance
router.get('/credit-balance', async (req, res) => {
  try {
    const settings = await Config.getCreditSettings();
    if (!settings.credit_url || !settings.credit_key) {
      return res.json({ success: false, error: 'Chưa cài đặt Credit API' });
    }
    const cleanUrl = settings.credit_url.replace(/\/api\/sign\/?$/, '');
    const balanceUrl = cleanUrl + '/api/me';
    const response = await axios.get(balanceUrl, {
      headers: { 'X-API-Key': settings.credit_key },
      timeout: 10000
    });
    if (response.data?.code === 0 && response.data?.data) {
      return res.json({
        success: true,
        username: response.data.data.username,
        credits: response.data.data.credits,
        is_active: response.data.data.is_active
      });
    }
    res.json({ success: false, error: response.data?.message || 'API Key không hợp lệ' });
  } catch (err) {
    const status = err.response?.status;
    if (status === 401 || status === 403) {
      return res.json({ success: false, error: 'API Key không hợp lệ' });
    }
    res.json({ success: false, error: err.message });
  }
});

// GET /api/config/saved-proxies
router.get('/saved-proxies', (req, res) => {
  db.all('SELECT proxy FROM proxies', [], (err, rows) => {
    if (err) {
      console.error('Error fetching saved proxies:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
    const proxies = rows ? rows.map(r => r.proxy) : [];
    res.json({ success: true, proxies });
  });
});

// POST /api/config/import-proxy
router.post('/import-proxy', async (req, res) => {
  try {
    const { proxies } = req.body;
    if (!proxies || !Array.isArray(proxies) || proxies.length === 0) {
      return res.status(400).json({ success: false, error: 'Danh sách proxy trống' });
    }

    const validProxies = [];
    for (const p of proxies) {
      const proxyStr = (p || '').trim();
      if (!proxyStr) continue;
      const parts = proxyStr.split(':');
      if (parts.length < 2) continue;
      validProxies.push(proxyStr);
    }

    if (validProxies.length === 0) {
      return res.status(400).json({ success: false, error: 'Không tìm thấy proxy hợp lệ' });
    }

    // Lấy danh sách proxy hiện có trong database để kiểm tra trùng
    const existingProxies = await new Promise((resolve) => {
      db.all('SELECT proxy FROM proxies', [], (err, rows) => {
        resolve(rows ? rows.map(r => r.proxy) : []);
      });
    });
    const existingSet = new Set(existingProxies);

    let newCount = 0;
    let dupCount = 0;
    const dbPromises = [];

    for (const proxy of validProxies) {
      if (existingSet.has(proxy)) {
        dupCount++;
      } else {
        newCount++;
        dbPromises.push(new Promise((resolve) => {
          db.run('INSERT OR REPLACE INTO proxies (proxy, ping) VALUES (?, ?)', [proxy, 0], (err) => {
            if (err) console.error('Error importing proxy directly:', err);
            resolve();
          });
        }));
      }
    }

    if (dbPromises.length > 0) {
      await Promise.all(dbPromises);
    }

    res.json({
      success: true,
      message: `Đã import xong: Thêm ${newCount} proxy mới, bỏ qua ${dupCount} proxy đã trùng khớp.`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/config/check-proxy
router.post('/check-proxy', async (req, res) => {
  try {
    const { proxies } = req.body;
    if (!proxies || !Array.isArray(proxies) || proxies.length === 0) {
      return res.status(400).json({ success: false, error: 'Danh sách proxy trống' });
    }

    const results = await Promise.all(proxies.map(async (p) => {
      const proxyStr = (p || '').trim();
      if (!proxyStr) {
        return { proxy: proxyStr, alive: false, error: 'Trống', ms: 0 };
      }
      const parts = proxyStr.split(':');
      if (parts.length < 2) {
        return { proxy: proxyStr, alive: false, error: 'Sai format', ms: 0 };
      }
      const ip = parts[0];
      const port = parts[1];
      let proxyUrl = 'http://' + ip + ':' + port;
      if (parts.length === 4) {
        proxyUrl = 'http://' + parts[2] + ':' + parts[3] + '@' + ip + ':' + port;
      }
      const startTime = Date.now();
      try {
        const agent = new HttpsProxyAgent(proxyUrl);
        await axios.get('https://httpbin.org/delay/0', {
          httpAgent: agent,
          httpsAgent: agent,
          timeout: 10000
        });
        const duration = Date.now() - startTime;
        return { proxy: proxyStr, alive: true, ms: duration, error: null };
      } catch (err) {
        const duration = Date.now() - startTime;
        let errMsg = 'Không kết nối được';
        if (err.code === 'ECONNRESET') {
          errMsg = 'Bị reset';
        } else if (err.code === 'ECONNREFUSED') {
          errMsg = 'Bị từ chối';
        } else if (err.code === 'ETIMEDOUT') {
          errMsg = 'Timeout';
        } else if (err.response?.status === 407) {
          errMsg = 'Sai auth';
        }
        return { proxy: proxyStr, alive: false, ms: duration, error: errMsg };
      }
    }));

    // Save alive proxies to database and remove dead ones
    const dbPromises = results.map(r => {
      return new Promise((resolve) => {
        if (r.alive) {
          db.run('INSERT OR REPLACE INTO proxies (proxy, ping) VALUES (?, ?)', [r.proxy, r.ms], (err) => {
            if (err) console.error('Error inserting proxy:', err);
            resolve();
          });
        } else {
          db.run('DELETE FROM proxies WHERE proxy = ?', [r.proxy], (err) => {
            if (err) console.error('Error deleting proxy:', err);
            resolve();
          });
        }
      });
    });
    await Promise.all(dbPromises);

    const aliveCount = results.filter(r => r.alive).length;
    const deadCount = results.filter(r => !r.alive).length;

    res.json({
      success: true,
      results,
      summary: {
        total: results.length,
        alive: aliveCount,
        dead: deadCount
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ===== AUTO-DELETE VIDEO ON SUCCESS =====

// GET /api/config/delete-video-on-success
router.get('/delete-video-on-success', (req, res) => {
  db.get('SELECT delete_video_on_success FROM config WHERE id = 1', [], (err, row) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, enabled: row ? !!row.delete_video_on_success : false });
  });
});

// POST /api/config/delete-video-on-success
router.post('/delete-video-on-success', (req, res) => {
  const { enabled } = req.body;
  const val = enabled ? 1 : 0;
  db.run('UPDATE config SET delete_video_on_success = ? WHERE id = 1', [val], (err) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, enabled: !!val });
  });
});

// POST /api/config/cleanup-completed-videos — manually trigger cleanup
router.post('/cleanup-completed-videos', async (req, res) => {
  try {
    const result = await cleanupCompletedVideos();
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Core cleanup function
function cleanupCompletedVideos() {
  return new Promise((resolve, reject) => {
    // Find completed tasks that haven't been cleaned up yet
    db.all(
      `SELECT id, video_path, video_filename FROM video_tasks 
       WHERE status = 'completed' AND (video_deleted IS NULL OR video_deleted = 0) AND video_path IS NOT NULL`,
      [],
      (err, rows) => {
        if (err) return reject(err);
        if (!rows || rows.length === 0) return resolve({ deleted: 0, errors: 0, details: [] });

        let deleted = 0;
        let errors = 0;
        const details = [];

        const promises = rows.map(task => {
          return new Promise((res2) => {
            try {
              if (fs.existsSync(task.video_path)) {
                fs.unlinkSync(task.video_path);
                deleted++;
                details.push({ file: task.video_filename, status: 'deleted' });
              } else {
                // File already gone, just mark it
                deleted++;
                details.push({ file: task.video_filename, status: 'not_found' });
              }
              // Mark as cleaned up
              db.run('UPDATE video_tasks SET video_deleted = 1 WHERE id = ?', [task.id], () => res2());
            } catch (e) {
              errors++;
              details.push({ file: task.video_filename, status: 'error', error: e.message });
              res2();
            }
          });
        });

        Promise.all(promises).then(() => {
          resolve({ deleted, errors, details });
        });
      }
    );
  });
}

// Auto-cleanup interval: check every 30 seconds if delete_video_on_success is enabled
setInterval(() => {
  db.get('SELECT delete_video_on_success FROM config WHERE id = 1', [], (err, row) => {
    if (err || !row || !row.delete_video_on_success) return;
    cleanupCompletedVideos()
      .catch(() => {});
  });
}, 30000); // 30 seconds

// GET /api/config/homeproxy-token
router.get('/homeproxy-token', async (req, res) => {
  try {
    db.run("ALTER TABLE config ADD COLUMN homeproxy_merchant_id TEXT DEFAULT ''", () => {});
    db.get('SELECT homeproxy_token, homeproxy_merchant_id FROM config WHERE id = 1', [], (err, row) => {
      res.json({
        success: true,
        homeproxy_token: row ? row.homeproxy_token || '' : '',
        homeproxy_merchant_id: row ? row.homeproxy_merchant_id || '' : ''
      });
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/config/homeproxy-token
router.post('/homeproxy-token', async (req, res) => {
  try {
    let { homeproxy_token, homeproxy_merchant_id } = req.body;
    homeproxy_token = (homeproxy_token || '').trim();
    if (homeproxy_token.toLowerCase().startsWith('bearer ')) {
      homeproxy_token = homeproxy_token.substring(7).trim();
    }
    homeproxy_merchant_id = (homeproxy_merchant_id || '').trim();

    db.run("ALTER TABLE config ADD COLUMN homeproxy_merchant_id TEXT DEFAULT ''", () => {});
    db.run('UPDATE config SET homeproxy_token = ?, homeproxy_merchant_id = ? WHERE id = 1',
      [homeproxy_token, homeproxy_merchant_id],
      (err) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true, message: 'Lưu HomeProxy API Token & Merchant ID thành công' });
      }
    );
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Helper function to sync proxies from HomeProxy
async function fetchAndSyncHomeProxy() {
  db.run("ALTER TABLE config ADD COLUMN homeproxy_merchant_id TEXT DEFAULT ''", () => {});

  const configRow = await new Promise((resolve) => {
    db.get('SELECT homeproxy_token, homeproxy_merchant_id FROM config WHERE id = 1', [], (err, row) => {
      resolve(row || {});
    });
  });

  let token = (configRow.homeproxy_token || '').trim();
  if (token.toLowerCase().startsWith('bearer ')) {
    token = token.substring(7).trim();
  }
  const merchantId = (configRow.homeproxy_merchant_id || '').trim();

  if (!token) {
    return { success: false, error: 'Chưa cài đặt HomeProxy token. Vui lòng nhập token ở tab Cài Đặt.' };
  }

  const endpoints = [
    'https://app.homeproxy.vn/api/v2/users/proxies',
    'https://app.homeproxy.vn/api/v2/user-proxies',
    'https://app.homeproxy.vn/api/v2/proxies',
    'https://app.homeproxy.vn/api/v1/user-proxies',
    'https://app.homeproxy.vn/api/v1/users/proxies',
    'https://app.homeproxy.vn/api/v1/proxy/list'
  ];

  const buildHeaders = (t, m) => {
    const h = { 'Authorization': `Bearer ${t}` };
    if (m) h['x-merchant-id'] = m;
    return h;
  };

  const authOptions = [
    (t, m) => ({ headers: buildHeaders(t, m) }),
    (t, m) => ({ headers: { 'Authorization': t, ...(m ? { 'x-merchant-id': m } : {}) } }),
    (t, m) => ({ headers: { 'x-api-key': t, ...(m ? { 'x-merchant-id': m } : {}) } }),
    (t, m) => ({ params: { token: t }, headers: m ? { 'x-merchant-id': m } : {} }),
    (t, m) => ({ params: { api_token: t }, headers: m ? { 'x-merchant-id': m } : {} })
  ];

  let proxyData = null;
  let lastErr = null;

  for (const url of endpoints) {
    for (const makeConfig of authOptions) {
      try {
        let allPagesData = [];
        let page = 1;
        let hasNextPage = true;

        while (hasNextPage && page <= 50) {
          const cfg = makeConfig(token, merchantId);
          const response = await axios.get(url, {
            ...cfg,
            params: { ...(cfg.params || {}), page, limit: 100, size: 100, page_size: 100, per_page: 100 },
            timeout: 10000
          });

          const resData = response.data;
          const list = Array.isArray(resData) ? resData :
                       (Array.isArray(resData?.data) ? resData.data :
                       (Array.isArray(resData?.result) ? resData.result :
                       (Array.isArray(resData?.proxies) ? resData.proxies :
                       (Array.isArray(resData?.list) ? resData.list : null))));

          if (list && list.length > 0) {
            allPagesData = allPagesData.concat(list);
            if (resData?.hasNextPage === false || list.length < 20 || Array.isArray(resData)) {
              hasNextPage = false;
            } else {
              page++;
            }
          } else {
            hasNextPage = false;
          }
        }

        if (allPagesData.length > 0) {
          proxyData = allPagesData;
          break;
        }
      } catch (err) {
        lastErr = err;
      }
    }
    if (proxyData) break;
  }

  if (!proxyData) {
    let errMsg = 'Không định dạng được dữ liệu API HomeProxy hoặc Token không hợp lệ.';
    if (lastErr) {
      if (lastErr.response && lastErr.response.status === 401) {
        errMsg = 'API Token HomeProxy hoặc x-merchant-id không hợp lệ hoặc đã hết hạn (status 401). Vui lòng kiểm tra lại trong tab Cài Đặt.';
      } else {
        errMsg = `Lỗi kết nối API HomeProxy: ${lastErr.message}`;
      }
    }
    return { success: false, error: errMsg };
  }

  const importedProxies = [];
  for (const item of proxyData) {
    if (typeof item === 'string') {
      const trimmed = item.trim();
      if (trimmed) importedProxies.push(trimmed);
      continue;
    }

    const p = item.proxy || item;
    const host = p.ipaddress?.domain || p.ipaddress?.ip || p.ipIn || p.ip || p.domain || item.ipaddress?.domain || item.ipaddress?.ip || item.ipIn || item.ip || item.domain || '';
    const port = p.port || item.port || '';
    const username = p.username || p.user || item.username || item.user || '';
    let password = p.password || p.pass || item.password || item.pass || '';

    if (password) {
      try {
        const decoded = Buffer.from(password, 'base64').toString('utf8');
        if (/^[a-zA-Z0-9_.-]+$/.test(decoded)) {
          password = decoded;
        }
      } catch (e) {}
    }

    if (host && port && (host.includes('.') || host === 'localhost')) {
      let proxyStr = '';
      if (username && password) {
        proxyStr = `${host}:${port}:${username}:${password}`;
      } else {
        proxyStr = `${host}:${port}`;
      }
      importedProxies.push(proxyStr);
    }
  }

  if (importedProxies.length === 0) {
    return { success: true, message: 'Tìm thấy 0 proxy hoạt động trên tài khoản HomeProxy.', count: 0 };
  }

  // Lấy danh sách proxy hiện có trong database để kiểm tra trùng
  const existingProxies = await new Promise((resolve) => {
    db.all('SELECT proxy FROM proxies', [], (err, rows) => {
      resolve(rows ? rows.map(r => r.proxy) : []);
    });
  });
  const existingSet = new Set(existingProxies);

  let newCount = 0;
  let dupCount = 0;
  const dbPromises = [];

  for (const proxy of importedProxies) {
    if (existingSet.has(proxy)) {
      dupCount++;
    } else {
      newCount++;
      dbPromises.push(new Promise((resolve) => {
        db.run('INSERT OR REPLACE INTO proxies (proxy, ping) VALUES (?, ?)', [proxy, 0], (err) => {
          if (err) console.error('Error importing proxy from HomeProxy:', err);
          resolve();
        });
      }));
    }
  }

  if (dbPromises.length > 0) {
    await Promise.all(dbPromises);
  }

  return {
    success: true,
    message: `Đồng bộ hoàn tất: Đã nhận ${importedProxies.length} proxy. Thêm ${newCount} proxy mới, bỏ qua ${dupCount} proxy đã trùng khớp.`,
    count: importedProxies.length,
    newCount,
    dupCount
  };
}

// POST /api/config/sync-homeproxy
router.post('/sync-homeproxy', async (req, res) => {
  try {
    const result = await fetchAndSyncHomeProxy();
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Auto-sync HomeProxy on startup (non-blocking) & định kỳ mỗi 10 phút
async function runHomeProxySync(isStartup = false) {
  try {
    const token = await Config.getHomeProxyToken();
    if (token && token.trim()) {
      if (isStartup) {
        console.log('🔄 [HomeProxy] Đang kết nối và đồng bộ proxy từ HomeProxy...');
      }
      const res = await fetchAndSyncHomeProxy();
      if (res.success) {
        console.log(`✅ [HomeProxy] Đã nạp ${res.count || 0} proxy từ HomeProxy vào Database.`);
      } else {
        console.warn(`⚠️ [HomeProxy] Đồng bộ thất bại: ${res.error}`);
      }
    }
  } catch (e) {
    console.warn(`⚠️ [HomeProxy] Lỗi đồng bộ: ${e.message}`);
  }
}

setTimeout(() => runHomeProxySync(true), 1000);
setInterval(() => runHomeProxySync(false), 10 * 60 * 1000);

// DELETE /api/config/clear-proxies
router.delete('/clear-proxies', (req, res) => {
  db.run('DELETE FROM proxies', [], (err) => {
    if (err) {
      console.error('Error clearing proxies:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({ success: true, message: 'Đã xóa toàn bộ proxy trong database thành công.' });
  });
});

// GET /api/config/telegram
router.get('/telegram', async (req, res) => {
  try {
    const settings = await Config.getTelegramSettings();
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/config/telegram
router.post('/telegram', async (req, res) => {
  try {
    const { telegram_token, telegram_chat_id, telegram_report_success, telegram_report_hourly } = req.body;
    await Config.updateTelegramSettings(
      telegram_token,
      telegram_chat_id,
      telegram_report_success,
      telegram_report_hourly
    );
    res.json({ success: true, message: 'Lưu cấu hình Telegram thành công.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/config/test-telegram
router.post('/test-telegram', async (req, res) => {
  try {
    const { telegram_token, telegram_chat_id } = req.body;
    if (!telegram_token || !telegram_chat_id) {
      return res.status(400).json({ success: false, error: 'Vui lòng điền Telegram Token và Chat ID.' });
    }
    const url = `https://api.telegram.org/bot${telegram_token.trim()}/sendMessage`;
    await axios.post(url, {
      chat_id: telegram_chat_id.trim(),
      text: '🔔 <b>TEST KẾT NỐI TELEGRAM BOT</b>\n\nKết nối thành công! Bot đã sẵn sàng gửi báo cáo.',
      parse_mode: 'HTML'
    }, { timeout: 10000 });
    res.json({ success: true, message: 'Gửi tin nhắn test thành công! Hãy kiểm tra Telegram để xác nhận.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/config/proxy-mode
router.get('/proxy-mode', async (req, res) => {
  try {
    let mode = 'homeproxy';
    db.run("ALTER TABLE config ADD COLUMN proxy_mode TEXT DEFAULT 'homeproxy'", () => {});
    const modeRow = await new Promise(r => db.get('SELECT proxy_mode FROM config WHERE id = 1', [], (e, row) => r(row)));
    if (modeRow && modeRow.proxy_mode) mode = modeRow.proxy_mode;
    res.json({ mode });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/config/proxy-mode
router.post('/proxy-mode', async (req, res) => {
  try {
    const { mode } = req.body;
    db.run("ALTER TABLE config ADD COLUMN proxy_mode TEXT DEFAULT 'homeproxy'", () => {});

    if (mode === 'homeproxy') {
      db.run("UPDATE config SET proxy_mode = 'homeproxy' WHERE id = 1", () => {});
      const syncRes = await fetchAndSyncHomeProxy();
      return res.json({
        success: true,
        mode: 'homeproxy',
        message: `🌐 Đã chuyển sang chế độ Fake IP bằng HomeProxy (${syncRes.count || 0} Proxy tĩnh trong CSDL)`
      });
    } else {
      db.run("UPDATE config SET proxy_mode = 'none' WHERE id = 1", () => {});
      db.run("UPDATE threads SET proxy_host = NULL, proxy_port = NULL, proxy_username = NULL, proxy_password = NULL", () => {});
      return res.json({ success: true, mode: 'none', message: '🚫 Đã chuyển sang chế độ sử dụng IP trực tiếp của máy tính (Không Proxy).' });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;