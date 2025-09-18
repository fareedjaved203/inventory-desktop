import os from 'os';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class LicenseManager {

  getDeviceFingerprint() {
    const hostname = os.hostname();
    const platform = os.platform();
    const arch = os.arch();
    const cpus = os.cpus()[0]?.model || 'unknown';
    
    const fingerprint = `${hostname}-${platform}-${arch}-${cpus}`;
    return crypto.createHash('sha256').update(fingerprint).digest('hex').substring(0, 16);
  }

  async validateLicense(licenseKey, userId, forceRebind = false) {
    try {
      const decoded = this.decodeLicenseKey(licenseKey);
      if (!decoded) {
        return { valid: false, error: 'Invalid license key format' };
      }

      const now = Math.floor(Date.now() / 1000);
      
      // Remove activation deadline check for existing licenses
      const existingLicense = await this.getUserLicense(userId);
      if (!existingLicense && now > decoded.activationDeadline) {
        return { valid: false, error: 'License activation window expired' };
      }
      
      if (now > decoded.expiry) {
        return { valid: false, error: 'License expired' };
      }

      const deviceFingerprint = this.getDeviceFingerprint();
      
      // Allow same license key to be used on multiple devices for same user
      if (existingLicense?.licenseKey === licenseKey) {
        // Update device fingerprint for current device
        await this.bindLicenseToUser(userId, licenseKey, deviceFingerprint, decoded.expiry, decoded.duration);
        return { 
          valid: true, 
          expiry: decoded.expiry,
          duration: decoded.duration 
        };
      }

      await this.bindLicenseToUser(userId, licenseKey, deviceFingerprint, decoded.expiry, decoded.duration);
      
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
        
        // Format duration for display
        const duration = this.formatDuration(durationSeconds);
        
        return { activationDeadline, expiry, duration };
        
      } else if (parts.length === 4) {
        // Old format: ACTIVATION_HIGH-ACTIVATION_LOW-EXPIRY_HIGH-EXPIRY_LOW
        const activationDeadline = (nums[0] << 16) | nums[1];
        const expiry = (nums[2] << 16) | nums[3];
        
        return { activationDeadline, expiry, duration: 'Legacy License' };
      }
      
      return null;
    } catch (error) {
      console.error('License decode error:', error);
      return null;
    }
  }

  async bindLicenseToUser(userId, licenseKey, deviceFingerprint, expiry, duration) {
    await prisma.license.upsert({
      where: { userId },
      update: {
        licenseKey,
        deviceFingerprint,
        expiry: BigInt(expiry),
        duration,
        activatedAt: new Date(),
        isTrial: false
      },
      create: {
        userId,
        licenseKey,
        deviceFingerprint,
        expiry: BigInt(expiry),
        duration,
        activatedAt: new Date(),
        isTrial: false
      }
    });
  }

  async getUserLicense(userId) {
    return await prisma.license.findUnique({
      where: { userId }
    });
  }

  async getCurrentLicenseExpiry(userId) {
    const license = await this.getUserLicense(userId);
    return license?.expiry ? Number(license.expiry) : null;
  }

  async isLicenseValid(userId) {
    const license = await this.getUserLicense(userId);
    console.log('License check for user:', userId, 'License:', license);
    
    if (!license?.expiry) {
      console.log('No license found, creating trial');
      return await this.createTrialLicense(userId);
    }
    
    // Skip device fingerprint check entirely - allow same account on multiple devices
    
    const now = Math.floor(Date.now() / 1000);
    const isValid = now <= Number(license.expiry);
    console.log('License validity check:', { now, expiry: Number(license.expiry), isValid, isTrial: license.isTrial });
    return isValid;
  }

  formatDuration(seconds) {
    if (seconds >= 25 * 365 * 24 * 60 * 60) return 'Lifetime';
    if (seconds >= 365 * 24 * 60 * 60) return `${Math.floor(seconds / (365 * 24 * 60 * 60))} Year${Math.floor(seconds / (365 * 24 * 60 * 60)) > 1 ? 's' : ''}`;
    if (seconds >= 30 * 24 * 60 * 60) return `${Math.floor(seconds / (30 * 24 * 60 * 60))} Month${Math.floor(seconds / (30 * 24 * 60 * 60)) > 1 ? 's' : ''}`;
    if (seconds >= 24 * 60 * 60) return `${Math.floor(seconds / (24 * 60 * 60))} Day${Math.floor(seconds / (24 * 60 * 60)) > 1 ? 's' : ''}`;
    if (seconds >= 60 * 60) return `${Math.floor(seconds / (60 * 60))} Hour${Math.floor(seconds / (60 * 60)) > 1 ? 's' : ''}`;
    if (seconds >= 60) return `${Math.floor(seconds / 60)} Minute${Math.floor(seconds / 60) > 1 ? 's' : ''}`;
    return `${seconds} Second${seconds > 1 ? 's' : ''}`;
  }

  generateTrialLicenseKey(durationSeconds) {
    // Generate license key matching license.bat format: RAND1-RAND2-DURATION_HIGH-DURATION_LOW-CHECKSUM
    const rand1 = Math.floor(Math.random() * 65536);
    const rand2 = Math.floor(Math.random() * 65536);
    const durHigh = Math.floor(durationSeconds / 65536);
    const durLow = durationSeconds & 0xFFFF;
    const checksum = (rand1 + rand2 + durHigh + durLow) & 0xFFFF;
    
    return `${rand1.toString(16).toUpperCase().padStart(4, '0')}-${rand2.toString(16).toUpperCase().padStart(4, '0')}-${durHigh.toString(16).toUpperCase().padStart(4, '0')}-${durLow.toString(16).toUpperCase().padStart(4, '0')}-${checksum.toString(16).toUpperCase().padStart(4, '0')}`;
  }

  async createTrialLicense(userId) {
    try {
      const now = Math.floor(Date.now() / 1000);
      const trialDuration = 7 * 24 * 60 * 60; // 7 days in seconds
      const trialExpiry = now + trialDuration;
      const deviceFingerprint = this.getDeviceFingerprint();
      const trialLicenseKey = this.generateTrialLicenseKey(trialDuration);
      
      console.log('Creating trial license:', { userId, now, trialExpiry, deviceFingerprint, trialLicenseKey });
      
      const license = await prisma.license.upsert({
        where: { userId },
        update: {
          licenseKey: trialLicenseKey,
          deviceFingerprint,
          expiry: BigInt(trialExpiry),
          duration: '7 Days Trial',
          activatedAt: new Date(),
          isTrial: true
        },
        create: {
          userId,
          licenseKey: trialLicenseKey,
          deviceFingerprint,
          expiry: BigInt(trialExpiry),
          duration: '7 Days Trial',
          activatedAt: new Date(),
          isTrial: true
        }
      });
      
      console.log('Created 7-day trial license for user:', userId, 'License:', license);
      return true;
    } catch (error) {
      console.error('Failed to create trial license:', error);
      return false;
    }
  }


}

export default new LicenseManager();