import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { authenticateToken } from './middleware.js';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    if (file.originalname.endsWith('.db')) {
      cb(null, true);
    } else {
      cb(new Error('Only .db files are allowed'));
    }
  },
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB limit
  }
});

// Extract the SQLite file path from DATABASE_URL
function getDbFilePath() {
  const dbUrl = process.env.DATABASE_URL || '';
  // DATABASE_URL is like "file:./prisma/inventory.db" or "file:/absolute/path/inventory.db"
  const filePath = dbUrl.replace('file:', '');
  if (path.isAbsolute(filePath)) return filePath;
  return path.resolve(process.cwd(), filePath);
}

router.post('/create', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `hisabghar_backup_${userId}_${timestamp}.db`;
    const backupsDir = path.join(process.cwd(), 'backups');
    const backupPath = path.join(backupsDir, backupFileName);

    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }

    const dbPath = getDbFilePath();
    if (!fs.existsSync(dbPath)) {
      return res.status(500).json({ error: 'Database file not found' });
    }

    // SQLite backup is just a file copy
    fs.copyFileSync(dbPath, backupPath);

    res.download(backupPath, backupFileName, (err) => {
      if (err) {
        console.error('Download error:', err);
        return res.status(500).json({ error: 'Failed to download backup' });
      }
      setTimeout(() => {
        if (fs.existsSync(backupPath)) fs.unlinkSync(backupPath);
      }, 5000);
    });
  } catch (error) {
    console.error('Backup creation error:', error);
    res.status(500).json({ error: 'Failed to create backup' });
  }
});

router.post('/restore', authenticateToken, upload.single('backupFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No backup file provided' });
    }

    const backupFilePath = req.file.path;
    const dbPath = getDbFilePath();

    // SQLite restore: replace the DB file with the uploaded one
    fs.copyFileSync(backupFilePath, dbPath);

    // Clean up uploaded file
    if (fs.existsSync(backupFilePath)) fs.unlinkSync(backupFilePath);

    res.json({ success: true, message: 'Database restored successfully. Please restart the application.' });
  } catch (error) {
    console.error('Restore error:', error);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: 'Failed to restore backup' });
  }
});

router.post('/email', authenticateToken, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const { default: emailService } = await import('./email-service.js');
    await emailService.sendDatabaseBackup(email);
    res.json({ success: true, message: 'Backup sent to ' + email });
  } catch (error) {
    console.error('Email backup error:', error);
    res.status(500).json({ error: error.message || 'Failed to send backup email' });
  }
});

export default router;

// Auto-backup scheduler — runs once daily for users with autoBackupEnabled
let backupInterval = null;

export function startAutoBackupScheduler(prisma) {
  // Check every hour, send backup once per day
  const HOUR = 60 * 60 * 1000;
  const lastBackupSent = new Map(); // userId -> timestamp

  backupInterval = setInterval(async () => {
    try {
      const settings = await prisma.shopSettings.findMany({
        where: { autoBackupEnabled: true },
        select: { userId: true, backupEmail: true }
      }).catch(() => []);

      for (const setting of settings) {
        if (!setting.backupEmail) continue;

        const lastSent = lastBackupSent.get(setting.userId) || 0;
        const now = Date.now();
        const oneDayMs = 24 * HOUR;

        if (now - lastSent < oneDayMs) continue;

        try {
          const { default: emailService } = await import('./email-service.js');
          await emailService.sendDatabaseBackup(setting.backupEmail);
          lastBackupSent.set(setting.userId, now);
          console.log(`Auto-backup sent to ${setting.backupEmail} for user ${setting.userId}`);
        } catch (err) {
          console.error(`Auto-backup failed for user ${setting.userId}:`, err.message);
        }
      }
    } catch (err) {
      console.error('Auto-backup scheduler error:', err.message);
    }
  }, HOUR);

  console.log('Auto-backup scheduler started (checks hourly)');
}
