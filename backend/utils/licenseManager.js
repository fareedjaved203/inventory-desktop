import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class LicenseManager {
  constructor() {
    // Store license data in the same location as the database
    // This matches Electron's app.getPath('userData') behavior
    let userDataPath;
    
    if (process.platform === 'win32') {
      userDataPath = path.join(process.env.APPDATA, 'inventory-management-desktop');
    } else if (process.platform === 'darwin') {
      userDataPath = path.join(os.homedir(), 'Library', 'Application Support', 'inventory-management-desktop');
    } else {
      userDataPath = path.join(os.homedir(), '.config', 'inventory-management-desktop');
    }
    
    this.deviceConfigFile = path.join(userDataPath, 'license_config.json');
    this.ensureDirectories();
  }

  ensureDirectories() {
    if (!fs.existsSync(path.dirname(this.deviceConfigFile))) {
      fs.mkdirSync(path.dirname(this.deviceConfigFile), { recursive: true });
    }
  }

  getDeviceFingerprint() {
    const hostname = os.hostname();
    const platform = os.platform();
    const arch = os.arch();
    const cpus = os.cpus()[0]?.model || 'unknown';
    
    const fingerprint = `${hostname}-${platform}-${arch}-${cpus}`;
    return crypto.createHash('sha256').update(fingerprint).digest('hex').substring(0, 16);
  }

  validateLicense(licenseKey) {
    try {
      // Decode license key to get expiry time
      const decoded = this.decodeLicenseKey(licenseKey);
      if (!decoded) {
        return { valid: false, error: 'Invalid license key format' };
      }

      const now = Math.floor(Date.now() / 1000);
      
      // Check if activation window has expired (10 minutes from generation)
      if (now > decoded.activationDeadline) {
        return { valid: false, error: 'License activation window expired' };
      }
      
      if (now > decoded.expiry) {
        return { valid: false, error: 'License expired' };
      }

      const deviceFingerprint = this.getDeviceFingerprint();
      const deviceConfig = this.getDeviceConfig();
      
      // Check if trying to use the same license key again
      if (deviceConfig.licenseKey === licenseKey) {
        return { valid: false, error: 'License key already activated on this device' };
      }
      
      // Check device fingerprint for cross-device usage
      if (deviceConfig.deviceFingerprint && 
          deviceConfig.deviceFingerprint !== deviceFingerprint) {
        return { valid: false, error: 'License bound to different device' };
      }

      // Bind license to this device
      this.bindLicenseToDevice(licenseKey, deviceFingerprint, decoded.expiry);
      
      return { 
        valid: true, 
        expiry: decoded.expiry,
        duration: decoded.duration 
      };
    } catch (error) {
      return { valid: false, error: 'Invalid license format' };
    }
  }

  decodeLicenseKey(licenseKey) {
    try {
      const parts = licenseKey.split('-');
      const nums = parts.map(part => parseInt(part, 16));
      if (nums.some(isNaN)) return null;
      
      if (parts.length === 5) {
        // New format: RAND1-RAND2-DURATION_HIGH-DURATION_LOW-CHECKSUM
        const durationSeconds = (nums[2] << 16) | nums[3];
        const providedChecksum = nums[4];
        
        // Validate checksum
        const calculatedChecksum = (nums[0] + nums[1] + nums[2] + nums[3]) & 0xFFFF;
        if (providedChecksum !== calculatedChecksum) {
          console.error('License checksum validation failed');
          return null;
        }
        
        // Calculate actual timestamps based on current time
        const currentTime = Math.floor(Date.now() / 1000);
        const activationDeadline = currentTime + 600; // 10 minutes from now
        const expiry = currentTime + durationSeconds;
        
        return { activationDeadline, expiry, duration: 'New Format' };
        
      } else if (parts.length === 4) {
        // Old format: ACTIVATION_HIGH-ACTIVATION_LOW-EXPIRY_HIGH-EXPIRY_LOW
        const activationDeadline = (nums[0] << 16) | nums[1];
        const expiry = (nums[2] << 16) | nums[3];
        
        return { activationDeadline, expiry, duration: 'Old Format' };
      }
      
      return null;
    } catch (error) {
      console.error('License decode error:', error);
      return null;
    }
  }

  bindLicenseToDevice(licenseKey, deviceFingerprint, expiry) {
    const config = {
      licenseKey,
      deviceFingerprint,
      expiry,
      activatedAt: new Date().toISOString()
    };
    fs.writeFileSync(this.deviceConfigFile, JSON.stringify(config, null, 2));
  }

  getDeviceConfig() {
    if (!fs.existsSync(this.deviceConfigFile)) {
      return {};
    }
    try {
      return JSON.parse(fs.readFileSync(this.deviceConfigFile, 'utf8'));
    } catch {
      return {};
    }
  }

  getCurrentLicenseExpiry() {
    const config = this.getDeviceConfig();
    return config.expiry || null;
  }

  setCurrentLicense(expiry, duration) {
    // This is handled by bindLicenseToDevice
  }

  isLicenseValid() {
    const config = this.getDeviceConfig();
    if (!config.expiry) {
      // Check if this is first startup - create 3-day trial
      return this.createTrialLicense();
    }
    
    const deviceFingerprint = this.getDeviceFingerprint();
    if (config.deviceFingerprint !== deviceFingerprint) return false;
    
    const now = Math.floor(Date.now() / 1000);
    return now <= config.expiry;
  }

  createTrialLicense() {
    try {
      const now = Math.floor(Date.now() / 1000);
      const trialExpiry = now + (3 * 24 * 60 * 60); // 3 days
      const deviceFingerprint = this.getDeviceFingerprint();
      
      const config = {
        licenseKey: 'TRIAL-LICENSE',
        deviceFingerprint,
        expiry: trialExpiry,
        activatedAt: new Date().toISOString(),
        isTrial: true
      };
      
      fs.writeFileSync(this.deviceConfigFile, JSON.stringify(config, null, 2));
      console.log('Created 3-day trial license');
      return true;
    } catch (error) {
      console.error('Failed to create trial license:', error);
      return false;
    }
  }


}

export default new LicenseManager();