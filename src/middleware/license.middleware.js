const licenseService = require('../services/license.service');

const protectRoute = (req, res, next) => {
  next();
};

const protectVideoOperations = (req, res, next) => {
  next();
};

const checkLicenseStatus = (req, res, next) => {
  next();
};

const logAccess = (req, res, next) => {
  next();
};

module.exports = {
  protectRoute,
  protectVideoOperations,
  checkLicenseStatus,
  logAccess
};