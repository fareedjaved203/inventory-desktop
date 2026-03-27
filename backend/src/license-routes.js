import express from 'express';
import licenseManager from '../utils/licenseManager.js';
import { authenticateToken } from './middleware.js';
const router = express.Router();

router.get('/device-id', async (req, res) => {
  try {
    const deviceId = licenseManager.getDeviceFingerprint();
    res.json({ deviceId });
  } catch (error) {
    console.error('Device ID error:', error);
    res.status(500).json({ error: 'Failed to get device ID' });
  }
});

router.post('/validate', authenticateToken, async (req, res) => {
  const { licenseKey } = req.body;
  const userId = req.userId;
  
  if (!licenseKey) {
    return res.status(400).json({ error: 'License key required' });
  }

  try {
    const result = await licenseManager.validateLicense(licenseKey, userId);
    
    if (result.valid) {
      res.json({ success: true, expiry: result.expiry, duration: result.duration, hasDemoData: result.hasDemoData || false });
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

router.post('/clear-demo-data', authenticateToken, async (req, res) => {
  try {
    const hasDemoData = await licenseManager.hasUserLoadedDemoData(req.userId);
    if (!hasDemoData) {
      return res.status(400).json({ error: 'No demo data found' });
    }
    await licenseManager.wipeUserData(req.userId);
    res.json({ success: true });
  } catch (error) {
    console.error('Clear demo data error:', error);
    res.status(500).json({ error: 'Failed to clear demo data' });
  }
});

export default router;