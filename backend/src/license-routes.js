import express from 'express';
import licenseManager from '../utils/licenseManager.js';
import { authenticateToken } from './middleware.js';
const router = express.Router();

router.post('/validate', authenticateToken, async (req, res) => {
  const { licenseKey } = req.body;
  const userId = req.userId;
  
  if (!licenseKey) {
    return res.status(400).json({ error: 'License key required' });
  }

  try {
    const result = await licenseManager.validateLicense(licenseKey, userId);
    
    if (result.valid) {
      res.json({ success: true, expiry: result.expiry });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: 'License validation failed' });
  }
});

router.get('/status', authenticateToken, async (req, res) => {
  const userId = req.userId;
  
  try {
    console.log('License status check for user:', userId);
    const isValid = await licenseManager.isLicenseValid(userId);
    const expiry = await licenseManager.getCurrentLicenseExpiry(userId);
    
    console.log('License status result:', { isValid, expiry });
    
    res.json({ 
      valid: isValid, 
      expiry,
      timeRemaining: expiry ? Math.max(0, expiry - Math.floor(Date.now() / 1000)) : 0
    });
  } catch (error) {
    console.error('License status check error:', error);
    res.status(500).json({ error: 'License status check failed' });
  }
});

export default router;