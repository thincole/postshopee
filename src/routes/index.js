const express = require('express');
const router = express.Router();
const { protectRoute, protectVideoOperations, checkLicenseStatus } = require('../middleware/license.middleware');
const threadRoutes = require('./thread.routes');
const userRoutes = require('./user.routes');
const videoRoutes = require('./video.routes');
const logRoutes = require('./log.routes');
const productRoutes = require('./product.routes');
const configRoutes = require('./config.routes');
const updateRoutes = require('./update.routes');
const licenseService = require('../services/license.service');

router.use(checkLicenseStatus);
router.use('/threads', protectRoute);
router.use('/threads', threadRoutes);
router.use('/videos', protectVideoOperations);
router.use('/videos', videoRoutes);
router.use('/users', protectRoute);
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/config', protectRoute);
router.use('/config', configRoutes);
router.use('/logs', checkLicenseStatus);
router.use('/logs', logRoutes);
router.use('/update', updateRoutes);

router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    license: {
      validated: licenseService.isValidated,
      lastValidation: licenseService.lastValidation
    },
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.version
  });
});

router.get('/license-info', protectRoute, (req, res) => {
  res.json({
    validated: licenseService.isValidated,
    lastValidation: licenseService.lastValidation,
    nextValidation: licenseService.lastValidation + (licenseService.validationInterval || 0),
    status: licenseService.isValidated ? 'active' : 'inactive'
  });
});

router.use((err, req, res, next) => {
  console.error('API Route Error:', err);
  if (err && err.message && err.message.includes('license')) {
    return res.status(403).json({ success: false, error: 'License validation failed', message: 'License validation failed' });
  }
  res.status(500).json({ success: false, error: 'Internal server error', message: 'An unexpected error occurred' });
});

module.exports = router;