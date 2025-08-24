const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

class LicenseManager {
  constructor() {
    this.licenseDir = path.join(__dirname, '../../licenses');
    this.deviceConfigFile = path.join(__dirname, '../data/device_config.json');
    this.ensureDirectories();
  }

  ensureDirectories() {
    if (!fs.existsSync(this.licenseDir)) {
      fs.mkdirSync(this.licenseDir, { recursive: true });
    }
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
      const licenseFile = path.join(this.licenseDir, `license_${licenseKey}.json`);
      if (!fs.existsSync(licenseFile)) {
        return { valid: false, error: 'Invalid license key' };
      }

      const license = JSON.parse(fs.readFileSync(licenseFile, 'utf8'));
      const now = Math.floor(Date.now() / 1000);
      
      if (now > license.expiry) {
        return { valid: false, error: 'License expired' };
      }

      const deviceFingerprint = this.getDeviceFingerprint();
      const deviceConfig = this.getDeviceConfig();
      
      // Check if license is already bound to a different device
      if (deviceConfig.licenseKey && deviceConfig.licenseKey !== licenseKey) {
        return { valid: false, error: 'Device already has a different license' };
      }
      
      if (deviceConfig.deviceFingerprint && deviceConfig.deviceFingerprint !== deviceFingerprint) {
        return { valid: false, error: 'License bound to different device' };
      }

      // Bind license to this device
      this.bindLicenseToDevice(licenseKey, deviceFingerprint, license.expiry);
      
      return { 
        valid: true, 
        expiry: license.expiry,
        duration: license.duration 
      };
    } catch (error) {
      return { valid: false, error: 'Invalid license format' };
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
    if (!config.expiry) return false;
    
    const deviceFingerprint = this.getDeviceFingerprint();
    if (config.deviceFingerprint !== deviceFingerprint) return false;
    
    const now = Math.floor(Date.now() / 1000);
    return now <= config.expiry;
  }


}

module.exports = new LicenseManager();