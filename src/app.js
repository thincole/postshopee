require('./utils/logger');
require('dotenv').config();

const licenseService = require('./services/license.service');
const LICENSE_KEY = process.env.LICENSE_KEY;

if (!LICENSE_KEY) {
  console.error('❌ LICENSE_KEY not found in .env file');
  console.log('💡 Please add LICENSE_KEY=your-license-key to .env file');
  process.exit(1);
}

if (!LICENSE_KEY.startsWith('MLS-2025-') || LICENSE_KEY.length < 15) {
  console.error('❌ Invalid LICENSE_KEY format');
  console.log('💡 License key must start with MLS-2025- and be at least 15 characters');
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
    const viewRoutes = require('./routes/view.routes');
    const apiRoutes = require('./routes');
    const { initJobs } = require('./jobs/cron');
    const { logAccess, checkLicenseStatus } = require('./middleware/license.middleware');
    
    const app = express();
    const PORT = process.env.PORT || 9696;
    
    // License check middleware - lightweight
    app.use(async (req, res, next) => {
      try {
        const isStatic = req.path.startsWith('/bootstrap') ||
                         req.path.startsWith('/scripts') ||
                         req.path.match(/\.(css|js|png|jpg|ico)$/);
        if (!isStatic) {
          if (!licenseService.isValidated) throw new Error('License not validated');
          const now = Date.now();
          const elapsed = now - (licenseService.lastValidation || 0);
          if (elapsed > 5 * 60 * 1000) {
            await licenseService.periodicValidation();
          }
        }
        next();
      } catch (e) {
        console.error('❌ License validation failed');
        res.status(403).json({
          error: 'License validation failed',
          message: 'Please ensure your license is valid and active'
        });
        setTimeout(() => {
          console.log('🔒 Application shutting down');
          process.exit(1);
        }, 1000);
      }
    });

    app.use(logAccess);
    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    
    app.set('view engine', 'ejs');
    app.set('views', path.join(__dirname, 'views'));
    
    app.use('/scripts', express.static(path.join(__dirname, 'views/scripts')));
    app.use('/bootstrap', express.static(path.join(__dirname, '../node_modules/bootstrap/dist')));
    
    app.use('/', viewRoutes);
    app.use('/api', apiRoutes);
    
    app.get('/license-status', checkLicenseStatus, (req, res) => {
      res.json({
        status: 'valid',
        validated: licenseService.isValidated,
        message: 'License is active'
      });
    });
    
    // Error handler
    app.use((err, req, res, next) => {
      console.error('Application error:', err.message);
      if (err.message && err.message.includes('license')) {
        setTimeout(() => process.exit(1), 1000);
      }
      res.status(500).json({ error: 'Internal server error' });
    });
    
    // 404 handler
    app.use((req, res) => {
      res.status(404).json({ error: 'Not found' });
    });
    
    // Init background jobs
    initJobs();
    
    // Periodic license validation (every 30 minutes)
    setInterval(async () => {
      try {
        await licenseService.periodicValidation();
      } catch (e) {
        console.error('❌ Background license validation failed');
        setTimeout(() => {
          if (!licenseService.isValidated) {
            console.log('🔒 License validation grace period expired');
            process.exit(1);
          }
        }, 2 * 60 * 1000);
      }
    }, 30 * 60 * 1000);
    
    // Periodic integrity checks (every 3 minutes)
    setInterval(() => {
      try {
        licenseService.performIntegrityChecks();
      } catch (e) {
        console.error('Integrity check failed');
        process.exit(1);
      }
    }, 3 * 60 * 1000);
    
    const server = app.listen(PORT, () => {
      console.log('🚀 Server running on port ' + PORT);
      console.log('🔐 License: ' + (licenseService.isValidated ? 'ACTIVE' : 'INACTIVE'));
      
      // Auto open browser in minisize app mode if not disabled
      if (process.env.OPEN_BROWSER !== 'false') {
        const url = `http://localhost:${PORT}`;
        const width = 1000;
        const height = 700;
        const chromeCmd = `start /min chrome --app="${url}" --window-size=${width},${height} --start-minimized`;
        const edgeCmd = `start /min msedge --app="${url}" --window-size=${width},${height} --start-minimized`;
        const defaultCmd = `start /min ${url}`;
        
        require('child_process').exec(chromeCmd, (err) => {
          if (err) {
            require('child_process').exec(edgeCmd, (err2) => {
              if (err2) {
                require('child_process').exec(defaultCmd);
              }
            });
          }
        });
      }
    });
    
    const shutdown = () => {
      console.log('🛑 Shutting down gracefully...');
      licenseService.clearSensitiveMemory();
      (() => {
        try {
          const dbConn = require('./database/connection').getConnection();
          dbConn.run('DELETE FROM proxies', [], () => {});
        } catch(e) {}
      })();
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    };
    
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (e) {
    console.error('❌ Failed to start application');
    console.log('❌ Startup failed');
    process.exit(1);
  }
}

// Clear all proxies on exit
const clearProxiesOnExit = () => {
  try {
    const dbConn = require('./database/connection').getConnection();
    dbConn.run('DELETE FROM proxies', [], () => {});
  } catch (e) {}
};
process.on('exit', clearProxiesOnExit);
process.on('SIGINT', () => {
  clearProxiesOnExit();
  setTimeout(() => process.exit(0), 100);
});
process.on('SIGTERM', () => {
  clearProxiesOnExit();
  setTimeout(() => process.exit(0), 100);
});

process.on('uncaughtException', (err) => {
  if (err && (err.code === 'ECONNRESET' || err.code === 'EPIPE' || 
              err.code === 'ETIMEDOUT' || err.code === 'ECONNREFUSED' ||
              (err.message && err.message.includes('ECONNRESET')))) {
    console.warn('⚠️ Ignored network connection reset in uncaughtException');
    return;
  }
  console.error('❌ Critical error occurred', err);
  licenseService.clearSensitiveMemory();
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  if (reason && (reason.code === 'ECONNRESET' || reason.code === 'EPIPE' ||
                 reason.code === 'ETIMEDOUT' || reason.code === 'ECONNREFUSED' ||
                 (reason.message && reason.message.includes('ECONNRESET')))) {
    console.warn('⚠️ Ignored network connection reset in unhandledRejection');
    return;
  }
  console.error('❌ Unhandled promise rejection', reason);
  licenseService.clearSensitiveMemory();
  process.exit(1);
});

console.log('🔄 Starting application...');
initializeApp().catch((err) => {
  console.error('❌ Startup failed', err);
  process.exit(1);
});
