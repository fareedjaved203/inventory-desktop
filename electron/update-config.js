const fs = require('fs');
const path = require('path');
const { app } = require('electron');

function getDbType() {
  let envPath;
  
  if (app.isPackaged) {
    // In packaged app, read from resources
    envPath = path.join(process.resourcesPath, 'backend/.env');
  } else {
    // In development, read from project
    envPath = path.join(__dirname, '../backend/.env');
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  const lines = envContent.split('\n');
  const localhostLine = lines.find(line => line.includes('localhost') && !line.trim().startsWith('#'));
  
  return localhostLine ? 'offline' : 'online';
}

function getUpdateConfig() {
  const dbType = getDbType();
  
  return {
    provider: 'github',
    owner: 'fareedjaved203',
    repo: 'inventory-desktop',
    releaseType: 'release',
    // Filter releases based on current DB type
    updaterCacheDirName: `hisab-ghar-${dbType}`,
    // Custom release filter
    requestHeaders: {
      'User-Agent': `HisabGhar-${dbType}`
    }
  };
}

module.exports = { getDbType, getUpdateConfig };