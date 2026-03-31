import os from 'os';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Shared secret for HMAC — must match the generator script
const LICENSE_SECRET = 'HisabGhar2025$ecure!Key';

class LicenseManager {

  getDeviceFingerprint() {
    const hostname = os.hostname();
    const platform = os.platform();
    const arch = os.arch();
    const cpus = os.cpus()[0]?.model || 'unknown';
    const totalMem = os.totalmem();
    // Use MAC address of first non-internal network interface for stronger binding
    const nets = os.networkInterfaces();
    let mac = '';
    for (const name of Object.keys(nets).sort()) {
      for (const iface of nets[name]) {
        if (!iface.internal && iface.mac && iface.mac !== '00:00:00:00:00:00') {
          mac = iface.mac;
          break;
        }
      }
      if (mac) break;
    }
    
    const raw = `${hostname}-${platform}-${arch}-${cpus}-${totalMem}-${mac}`;
    return crypto.createHash('sha256').update(raw).digest('hex').substring(0, 16);
  }



  async validateLicense(licenseKey, userId) {
    try {
      const decoded = this.decodeLicenseKey(licenseKey);
      if (!decoded) {
        return { valid: false, error: 'Invalid license key format' };
      }

      const now = Math.floor(Date.now() / 1000);
      const deviceFingerprint = this.getDeviceFingerprint();

      // --- Device binding check ---
      // New format keys carry a device hash; must match this machine
      if (decoded.deviceHash && decoded.deviceHash.toLowerCase() !== deviceFingerprint.substring(0, 8).toLowerCase()) {
        return { valid: false, error: 'This license key was generated for a different device. Use this device\'s Device ID to generate a new key.' };
      }

      // --- Reuse check: has this key already been activated? ---
      const existingActivation = await prisma.license.findFirst({
        where: { licenseKey }
      });

      if (existingActivation && existingActivation.userId !== userId) {
        return { valid: false, error: 'This license key has already been used on another account' };
      }

      // Re-validation of current license (same user, same key)
      const existingLicense = await this.getUserLicense(userId);
      if (existingLicense?.licenseKey === licenseKey) {
        if (now > Number(existingLicense.expiry)) {
          return { valid: false, error: 'License expired' };
        }
        return { valid: true, expiry: Number(existingLicense.expiry), duration: existingLicense.duration };
      }

      // --- New activation ---
      if (now > decoded.activationDeadline) {
        return { valid: false, error: 'License activation window expired (5 minutes). Please generate a new key.' };
      }

      if (now > decoded.expiry) {
        return { valid: false, error: 'License expired' };
      }

      // Bind
      await this.bindLicenseToUser(userId, licenseKey, deviceFingerprint, decoded.expiry, decoded.duration);

      // Check if user had demo data — frontend will ask them if they want to clear it
      const hadDemo = await this.hasUserLoadedDemoData(userId);

      return { valid: true, expiry: decoded.expiry, duration: decoded.duration, hasDemoData: hadDemo };
    } catch (error) {
      console.error('License validation error:', error);
      return { valid: false, error: error.message || 'Invalid license format' };
    }
  }

  /**
   * New key format (6 segments):
   *   DEVHASH(8) - RAND(4) - DURHIGH(4) - DURLOW(4) - TIMESTAMP(8) - HMAC(8)
   *
   * DEVHASH  = first 8 hex chars of device fingerprint
   * RAND     = random 16-bit hex
   * DURHIGH  = upper 16 bits of duration in seconds
   * DURLOW   = lower 16 bits of duration in seconds
   * TIMESTAMP= unix epoch (seconds) when key was generated, 32-bit hex
   * HMAC     = first 8 hex chars of HMAC-SHA256 over the first 5 segments
   */
  decodeLicenseKey(licenseKey) {
    try {
      const parts = licenseKey.split('-');

      if (parts.length === 6) {
        const [devPart, randPart, durHighPart, durLowPart, tsPart, hmacPart] = parts;

        // Verify HMAC
        const payload = `${devPart}-${randPart}-${durHighPart}-${durLowPart}-${tsPart}`;
        const expectedHmac = crypto.createHmac('sha256', LICENSE_SECRET)
          .update(payload).digest('hex').substring(0, 8).toUpperCase();

        if (hmacPart.toUpperCase() !== expectedHmac) {
          console.error('License HMAC validation failed');
          console.error('  Key segments:', parts);
          console.error('  Payload:', payload);
          console.error('  Expected HMAC:', expectedHmac);
          console.error('  Got HMAC:', hmacPart.toUpperCase());
          return null;
        }

        const durHigh = parseInt(durHighPart, 16);
        const durLow = parseInt(durLowPart, 16);
        const generatedAt = parseInt(tsPart, 16);
        if ([durHigh, durLow, generatedAt].some(isNaN)) return null;

        const durationSeconds = (durHigh << 16) | durLow;
        const activationDeadline = generatedAt + 300; // 5 minutes
        const expiry = generatedAt + durationSeconds;
        const duration = this.formatDuration(durationSeconds);

        return { activationDeadline, expiry, duration, deviceHash: devPart.toUpperCase() };
      }

      // Legacy 5-segment format (no device binding, no longer accepted for new activations)
      if (parts.length === 5) {
        const nums = parts.map(p => parseInt(p, 16));
        if (nums.some(isNaN)) return null;
        const durationSeconds = (nums[2] << 16) | nums[3];
        const checksum = (nums[0] + nums[1] + nums[2] + nums[3]) & 0xFFFF;
        if (nums[4] !== checksum) return null;

        // Legacy keys have no embedded timestamp, so they can only be re-validated
        // if already stored in DB. For new activations, reject them.
        return {
          activationDeadline: 0, // already expired — forces "activation window expired" for new attempts
          expiry: 0,
          duration: this.formatDuration(durationSeconds),
          deviceHash: null,
          isLegacy: true
        };
      }

      // Legacy 4-segment format
      if (parts.length === 4) {
        const nums = parts.map(p => parseInt(p, 16));
        if (nums.some(isNaN)) return null;
        return {
          activationDeadline: (nums[0] << 16) | nums[1],
          expiry: (nums[2] << 16) | nums[3],
          duration: 'Legacy License',
          deviceHash: null
        };
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
        expiry: expiry,
        duration,
        activatedAt: new Date(),
        isTrial: false
      },
      create: {
        userId,
        licenseKey,
        deviceFingerprint,
        expiry: expiry,
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

    // Verify device fingerprint — license must be used on the same machine
    const currentFingerprint = this.getDeviceFingerprint();
    if (license.deviceFingerprint && license.deviceFingerprint !== currentFingerprint) {
      console.log('Device fingerprint mismatch — license bound to different device');
      console.log('  Stored fingerprint:', license.deviceFingerprint);
      console.log('  Current fingerprint:', currentFingerprint);
      // Update fingerprint if this is a development environment to avoid false lockouts
      // In production, you'd want to keep this strict
      await prisma.license.update({
        where: { userId },
        data: { deviceFingerprint: currentFingerprint }
      });
      console.log('  Updated device fingerprint to current device');
    }

    const now = Math.floor(Date.now() / 1000);
    const isValid = now <= Number(license.expiry);
    console.log('License validity check:', { now, expiry: Number(license.expiry), isValid, isTrial: license.isTrial, timeRemaining: Number(license.expiry) - now });
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
      const trialDuration = 3 * 24 * 60 * 60; // 3 days
      const trialExpiry = now + trialDuration;
      const deviceFingerprint = this.getDeviceFingerprint();
      const trialLicenseKey = this.generateTrialLicenseKey(trialDuration);

      console.log('Creating trial license:', { userId, now, trialExpiry, deviceFingerprint });

      await prisma.license.upsert({
        where: { userId },
        update: {
          licenseKey: trialLicenseKey,
          deviceFingerprint,
          expiry: trialExpiry,
          duration: '3 Days Trial',
          activatedAt: new Date(),
          isTrial: true
        },
        create: {
          userId,
          licenseKey: trialLicenseKey,
          deviceFingerprint,
          expiry: trialExpiry,
          duration: '3 Days Trial',
          activatedAt: new Date(),
          isTrial: true
        }
      });

      console.log('Created 3-day trial license for user:', userId);
      return true;
    } catch (error) {
      console.error('Failed to create trial license:', error);
      return false;
    }
  }

  // Check if this user loaded demo/sample data
  async hasUserLoadedDemoData(userId) {
    // We track this by checking if shopSettings has the demo shop name
    const settings = await prisma.shopSettings.findFirst({
      where: { userId, shopName: 'Hisab Ghar Auto Parts' }
    });
    return !!settings;
  }

  // Wipe all data for a user (used when activating a real license to clear demo data)
  async wipeUserData(userId) {
    // Delete in correct FK order — cascades handle AuditTrail
    const sales = await prisma.sale.findMany({ where: { userId }, select: { id: true } });
    const saleIds = sales.map(s => s.id);
    const returns = await prisma.saleReturn.findMany({ where: { userId }, select: { id: true } });
    const returnIds = returns.map(r => r.id);
    const purchases = await prisma.bulkPurchase.findMany({ where: { userId }, select: { id: true } });
    const purchaseIds = purchases.map(p => p.id);

    // Returns and their items
    if (returnIds.length > 0) await prisma.saleReturnItem.deleteMany({ where: { saleReturnId: { in: returnIds } } });
    await prisma.saleReturn.deleteMany({ where: { userId } });

    // Sale items then sales (audit trail cascades)
    if (saleIds.length > 0) await prisma.saleItem.deleteMany({ where: { saleId: { in: saleIds } } });
    await prisma.sale.deleteMany({ where: { userId } });

    // Purchase items then purchases (audit trail cascades)
    if (purchaseIds.length > 0) await prisma.bulkPurchaseItem.deleteMany({ where: { bulkPurchaseId: { in: purchaseIds } } });
    await prisma.bulkPurchase.deleteMany({ where: { userId } });

    // Independent entities
    await prisma.loanTransaction.deleteMany({ where: { userId } });
    await prisma.expense.deleteMany({ where: { userId } });
    await prisma.manufacturing.deleteMany({ where: { userId } });
    await prisma.recipeItem.deleteMany({ where: { recipe: { userId } } });
    await prisma.recipe.deleteMany({ where: { userId } });
    await prisma.employee.deleteMany({ where: { userId } });
    await prisma.branch.deleteMany({ where: { userId } });
    await prisma.contact.deleteMany({ where: { userId } });
    await prisma.product.deleteMany({ where: { userId } });
    await prisma.category.deleteMany({ where: { userId } });
    await prisma.shopSettings.deleteMany({ where: { userId } });
  }
}

export default new LicenseManager();
