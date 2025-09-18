const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, 'backend', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');

// Check if localhost line is uncommented (not starting with #)
const lines = envContent.split('\n');
const localhostLine = lines.find(line => line.includes('localhost') && !line.trim().startsWith('#'));

console.log(localhostLine ? 'offline' : 'online');