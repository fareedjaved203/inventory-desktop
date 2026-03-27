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

export default router;
