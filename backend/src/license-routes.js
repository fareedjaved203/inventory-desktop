const express = require('express');
const licenseManager = require('../utils/licenseManager');
const router = express.Router();

router.post('/validate', (req, res) => {
  const { licenseKey } = req.body;
  
  if (!licenseKey) {
    return res.status(400).json({ error: 'License key required' });
  }

  const result = licenseManager.validateLicense(licenseKey);
  
  if (result.valid) {
    licenseManager.setCurrentLicense(result.expiry, result.duration);
    res.json({ success: true, expiry: result.expiry });
  } else {
    res.status(400).json({ error: result.error });
  }
});

router.get('/status', (req, res) => {
  const isValid = licenseManager.isLicenseValid();
  const expiry = licenseManager.getCurrentLicenseExpiry();
  
  res.json({ 
    valid: isValid, 
    expiry,
    timeRemaining: expiry ? Math.max(0, expiry - Math.floor(Date.now() / 1000)) : 0
  });
});

module.exports = router;