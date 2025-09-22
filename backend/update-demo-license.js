import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEMO_EMAIL = 'demo@gmail.com';
const LICENSE_KEY = '7FB2-8CE9-01E1-3380-41FC';

async function updateDemoLicense() {
  try {
    console.log('Updating demo account license...');

    // Find demo user
    const demoUser = await prisma.user.findUnique({
      where: { email: DEMO_EMAIL }
    });

    if (!demoUser) {
      console.error('Demo user not found. Please create demo@gmail.com user first.');
      return;
    }

    console.log(`Found demo user: ${demoUser.id}`);

    // Update license for demo user
    const licenseExpiry = Math.floor(new Date('2025-12-31').getTime() / 1000);
    
    await prisma.license.upsert({
      where: { userId: demoUser.id },
      update: {
        licenseKey: LICENSE_KEY,
        deviceFingerprint: 'demo-device-fingerprint',
        expiry: BigInt(licenseExpiry),
        duration: '1_YEAR',
        isTrial: false,
        activatedAt: new Date()
      },
      create: {
        userId: demoUser.id,
        licenseKey: LICENSE_KEY,
        deviceFingerprint: 'demo-device-fingerprint',
        expiry: BigInt(licenseExpiry),
        duration: '1_YEAR',
        isTrial: false,
        activatedAt: new Date()
      }
    });

    console.log('✅ License updated successfully!');
    console.log(`License Key: ${LICENSE_KEY}`);
    console.log('Duration: 1 Year');
    console.log('Expires: December 31, 2025');
    console.log('Status: Active (Non-trial)');

  } catch (error) {
    console.error('Error updating license:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateDemoLicense();