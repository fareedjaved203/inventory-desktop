#!/usr/bin/env node
/**
 * License Generator (Device-Bound)
 * 
 * Usage:
 *   node generate-license.js <deviceId> <duration>
 * 
 * Duration formats:
 *   5m        = 5 minutes
 *   2h        = 2 hours
 *   30d       = 30 days
 *   1y        = 1 year
 *   lifetime  = 30 years
 * 
 * Examples:
 *   node generate-license.js 2829bc545970b247 lifetime
 *   node generate-license.js 2829bc545970b247 1y
 *   node generate-license.js 2829bc545970b247 30d
 */

const crypto = require('crypto');

const LICENSE_SECRET = 'HisabGhar2025$ecure!Key';

function parseDuration(input) {
  const str = input.toLowerCase().trim();
  if (str === 'lifetime') return 30 * 365 * 24 * 60 * 60;
  const match = str.match(/^(\d+)\s*(m|h|d|y)$/);
  if (!match) return null;
  const num = parseInt(match[1], 10);
  switch (match[2]) {
    case 'm': return num * 60;
    case 'h': return num * 60 * 60;
    case 'd': return num * 24 * 60 * 60;
    case 'y': return num * 365 * 24 * 60 * 60;
    default: return null;
  }
}

function generateLicense(deviceId, durationSeconds) {
  const now = Math.floor(Date.now() / 1000);
  const devHash = deviceId.substring(0, 8).toUpperCase();
  const rand = Math.floor(Math.random() * 65536);
  const durHigh = (durationSeconds >>> 16) & 0xFFFF;
  const durLow = durationSeconds & 0xFFFF;

  const tsHex = now.toString(16).toUpperCase().padStart(8, '0');
  const randHex = rand.toString(16).toUpperCase().padStart(4, '0');
  const durHighHex = durHigh.toString(16).toUpperCase().padStart(4, '0');
  const durLowHex = durLow.toString(16).toUpperCase().padStart(4, '0');

  const payload = `${devHash}-${randHex}-${durHighHex}-${durLowHex}-${tsHex}`;
  const hmac = crypto.createHmac('sha256', LICENSE_SECRET)
    .update(payload).digest('hex').substring(0, 8).toUpperCase();

  return `${payload}-${hmac}`;
}

// --- Main ---
const args = process.argv.slice(2);
if (args.length < 2) {
  console.log('Usage: node generate-license.js <deviceId> <duration>');
  console.log('');
  console.log('Duration: 5m, 2h, 30d, 1y, lifetime');
  process.exit(1);
}

const [deviceId, durationInput] = args;
const durationSeconds = parseDuration(durationInput);

if (!durationSeconds) {
  console.error('Invalid duration. Use: 5m, 2h, 30d, 1y, or lifetime');
  process.exit(1);
}

if (deviceId.length < 8) {
  console.error('Device ID must be at least 8 characters');
  process.exit(1);
}

const license = generateLicense(deviceId, durationSeconds);

console.log('');
console.log('=== LICENSE GENERATED ===');
console.log(`License Key : ${license}`);
console.log(`Device ID   : ${deviceId}`);
console.log(`Duration    : ${durationInput}`);
console.log(`Activate    : within 5 minutes`);
console.log('=========================');
