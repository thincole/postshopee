// Shopee Video Uploader - Entry Point
require('dotenv').config();
require('./src/utils/logger');

// Patch license service (bypass external checks)
const { patchLicenseService } = require('./src/services/license-patch');
const licenseService = require('./src/services/license.service');
patchLicenseService(licenseService);

const LICENSE_KEY = process.env.LICENSE_KEY;
if (!LICENSE_KEY || !LICENSE_KEY.startsWith('MLS-2025-') || LICENSE_KEY.length < 15) {
  console.error('❌ Invalid or missing LICENSE_KEY in .env');
  process.exit(1);
}

async function initializeApp() {
  try {
    console.log('🚀 Starting Shopee Video Uploader...');
    console.log('🔑 Using license: ' + LICENSE_KEY.substring(0, 12) + '...');
    await licenseService.initializeLicenseProtection(LICENSE_KEY);

    const express = require('express');
    const cors = require('cors');
    const path = require('path');

    const app = express();
    const PORT = parseInt(process.env.PORT || '6868', 10);

    // Fast static check middleware
    app.use((req, res, next) => {
      next();
    });

    const { logAccess, checkLicenseStatus } = require('./src/middleware/license.middleware');
    app.use(logAccess);
    app.use(cors());
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ extended: true, limit: '50mb' }));

    app.set('view engine', 'ejs');
    app.set('views', path.join(__dirname, 'src/views'));
    app.use('/scripts', express.static(path.join(__dirname, 'src/views/scripts')));
    app.use('/bootstrap', express.static(path.join(__dirname, 'node_modules/bootstrap/dist')));

    const viewRoutes = require('./src/routes/view.routes');
    const apiRoutes = require('./src/routes');
    app.use('/', viewRoutes);
    app.use('/api', apiRoutes);

    app.get('/license-status', checkLicenseStatus, (req, res) => {
      res.json({ status: 'valid', validated: licenseService.isValidated, message: 'License is active' });
    });

    app.use((err, req, res, next) => {
      console.error('Application error:', err);
      res.status(500).json({ error: 'Internal server error', message: err.message });
    });

    app.use((req, res) => { res.status(404).json({ error: 'Not found' }); });

    // Start background cron jobs
    const { initJobs } = require('./src/jobs/cron');
    initJobs();

    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌐 Truy cập: http://localhost:${PORT} hoặc http://127.0.0.1:${PORT}`);
      console.log('🔐 License: ACTIVE');

      if (process.env.OPEN_BROWSER !== 'false') {
        const url = `http://localhost:${PORT}`;
        require('child_process').exec(`start /min chrome --app="${url}" --window-size=1000,700 --start-minimized`, (err) => {
          if (err) require('child_process').exec(`start /min msedge --app="${url}" --window-size=1000,700 --start-minimized`, (err2) => {
            if (err2) require('child_process').exec(`start /min ${url}`);
          });
        });
      }
    });

    const shutdown = () => {
      console.log('🛑 Shutting down gracefully...');
      licenseService.clearSensitiveMemory();
      try { require('./src/database/connection').getConnection().run('DELETE FROM proxies', [], () => {}); } catch(e) {}
      server.close(() => { console.log('✅ Server closed'); process.exit(0); });
    };
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (e) {
    console.error('❌ Failed to start application', e);
    process.exit(1);
  }
}

// Cleanup on exit
const clearProxies = () => { try { require('./src/database/connection').getConnection().run('DELETE FROM proxies', [], () => {}); } catch(e) {} };
process.on('exit', clearProxies);

process.on('uncaughtException', (err) => {
  if (err && (err.code === 'ECONNRESET' || err.code === 'EPIPE' || err.code === 'ETIMEDOUT' || err.code === 'ECONNREFUSED' || (err.message && err.message.includes('ECONNRESET')))) {
    console.warn('⚠️ Ignored network error in uncaughtException');
    return;
  }
  console.error('❌ Critical error:', err);
});

process.on('unhandledRejection', (reason) => {
  if (reason && (reason.code === 'ECONNRESET' || reason.code === 'EPIPE' || reason.code === 'ETIMEDOUT' || reason.code === 'ECONNREFUSED' || (reason.message && reason.message.includes('ECONNRESET')))) {
    console.warn('⚠️ Ignored network error in unhandledRejection');
    return;
  }
  console.error('❌ Unhandled rejection:', reason);
});

console.log('🔄 Starting application...');
initializeApp().catch((err) => { console.error('❌ Startup failed', err); process.exit(1); });
