import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'crypto';

// Mock @prisma/client before any imports — must be a real constructor
vi.mock('@prisma/client', () => {
  return {
    PrismaClient: class MockPrismaClient {},
  };
});

// Mock os module — we control all hardware attributes
vi.mock('os', () => {
  return {
    default: {
      hostname: vi.fn().mockReturnValue('test-host'),
      platform: vi.fn().mockReturnValue('win32'),
      arch: vi.fn().mockReturnValue('x64'),
      cpus: vi.fn().mockReturnValue([{ model: 'Intel Core i7' }]),
      totalmem: vi.fn().mockReturnValue(17179869184),
      networkInterfaces: vi.fn().mockReturnValue({}),
    },
  };
});

// Import after mocks are set up
import os from 'os';
import licenseManager from './licenseManager.js';

// Helper: compute expected fingerprint given a MAC string
function expectedFingerprint(mac) {
  const raw = `test-host-win32-x64-Intel Core i7-17179869184-${mac}`;
  return crypto.createHash('sha256').update(raw).digest('hex').substring(0, 16);
}

// 4.1 — Deterministic fingerprint regardless of Object.keys() ordering with multiple interfaces
describe('getDeviceFingerprint - multiple non-internal interfaces (Task 4.1)', () => {
  it('returns the same fingerprint regardless of interface insertion order', () => {
    // Order A: Wi-Fi first, Ethernet second
    const interfacesOrderA = {
      'Wi-Fi': [{ internal: false, mac: 'aa:bb:cc:dd:ee:ff' }],
      'Ethernet': [{ internal: false, mac: '11:22:33:44:55:66' }],
    };

    os.networkInterfaces.mockReturnValue(interfacesOrderA);
    const fpA = licenseManager.getDeviceFingerprint();

    // Order B: Ethernet first, Wi-Fi second
    const interfacesOrderB = {
      'Ethernet': [{ internal: false, mac: '11:22:33:44:55:66' }],
      'Wi-Fi': [{ internal: false, mac: 'aa:bb:cc:dd:ee:ff' }],
    };

    os.networkInterfaces.mockReturnValue(interfacesOrderB);
    const fpB = licenseManager.getDeviceFingerprint();

    expect(fpA).toBe(fpB);
    // After sorting, 'Ethernet' comes first alphabetically → MAC = '11:22:33:44:55:66'
    expect(fpA).toBe(expectedFingerprint('11:22:33:44:55:66'));
  });

  it('returns the same fingerprint with three interfaces in any order', () => {
    const ifaces = {
      'Zigbee': [{ internal: false, mac: 'cc:cc:cc:cc:cc:cc' }],
      'Bluetooth': [{ internal: false, mac: 'bb:bb:bb:bb:bb:bb' }],
      'Adapter': [{ internal: false, mac: 'aa:aa:aa:aa:aa:aa' }],
    };

    os.networkInterfaces.mockReturnValue(ifaces);
    const fp1 = licenseManager.getDeviceFingerprint();

    // Reverse order
    const ifacesReversed = {
      'Adapter': [{ internal: false, mac: 'aa:aa:aa:aa:aa:aa' }],
      'Bluetooth': [{ internal: false, mac: 'bb:bb:bb:bb:bb:bb' }],
      'Zigbee': [{ internal: false, mac: 'cc:cc:cc:cc:cc:cc' }],
    };

    os.networkInterfaces.mockReturnValue(ifacesReversed);
    const fp2 = licenseManager.getDeviceFingerprint();

    expect(fp1).toBe(fp2);
    // 'Adapter' is first alphabetically → MAC = 'aa:aa:aa:aa:aa:aa'
    expect(fp1).toBe(expectedFingerprint('aa:aa:aa:aa:aa:aa'));
  });
});

// 4.2 — Single non-internal interface: fingerprint is stable
describe('getDeviceFingerprint - single non-internal interface (Task 4.2)', () => {
  it('returns a stable fingerprint with one non-internal interface', () => {
    const interfaces = {
      'Ethernet': [{ internal: false, mac: '11:22:33:44:55:66' }],
    };

    os.networkInterfaces.mockReturnValue(interfaces);
    const fp1 = licenseManager.getDeviceFingerprint();
    const fp2 = licenseManager.getDeviceFingerprint();

    expect(fp1).toBe(fp2);
    expect(fp1).toBe(expectedFingerprint('11:22:33:44:55:66'));
  });

  it('returns correct fingerprint when single interface is mixed with internal ones', () => {
    const interfaces = {
      'Loopback': [{ internal: true, mac: '00:00:00:00:00:00' }],
      'Wi-Fi': [{ internal: false, mac: 'dd:ee:ff:00:11:22' }],
    };

    os.networkInterfaces.mockReturnValue(interfaces);
    const fp = licenseManager.getDeviceFingerprint();

    // Only Wi-Fi is non-internal, so MAC = 'dd:ee:ff:00:11:22'
    expect(fp).toBe(expectedFingerprint('dd:ee:ff:00:11:22'));
  });
});

// 4.3 — No non-internal interfaces: fingerprint uses empty MAC
describe('getDeviceFingerprint - no non-internal interfaces (Task 4.3)', () => {
  it('returns a stable fingerprint when all interfaces are internal', () => {
    const interfaces = {
      'lo': [{ internal: true, mac: '00:00:00:00:00:00' }],
      'lo0': [{ internal: true, mac: '00:00:00:00:00:00' }],
    };

    os.networkInterfaces.mockReturnValue(interfaces);
    const fp1 = licenseManager.getDeviceFingerprint();
    const fp2 = licenseManager.getDeviceFingerprint();

    expect(fp1).toBe(fp2);
    // No non-internal interface → mac stays empty string
    expect(fp1).toBe(expectedFingerprint(''));
  });

  it('returns a stable fingerprint when interfaces have only zero MACs', () => {
    const interfaces = {
      'vEthernet': [{ internal: false, mac: '00:00:00:00:00:00' }],
      'Teredo': [{ internal: false, mac: '00:00:00:00:00:00' }],
    };

    os.networkInterfaces.mockReturnValue(interfaces);
    const fp = licenseManager.getDeviceFingerprint();

    // All MACs are zero → treated as no valid MAC → empty string
    expect(fp).toBe(expectedFingerprint(''));
  });

  it('returns a stable fingerprint when there are no interfaces at all', () => {
    os.networkInterfaces.mockReturnValue({});
    const fp = licenseManager.getDeviceFingerprint();

    expect(fp).toBe(expectedFingerprint(''));
  });
});
