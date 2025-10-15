import express from 'express';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { authenticateToken } from './middleware.js';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    if (file.originalname.endsWith('.sql')) {
      cb(null, true);
    } else {
      cb(new Error('Only .sql files are allowed'));
    }
  },
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

router.post('/create', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `hisabghar_backup_${userId}_${timestamp}.sql`;
    const backupPath = path.join(process.cwd(), 'backups', backupFileName);
    
    // Ensure backups directory exists
    const backupsDir = path.dirname(backupPath);
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }
    
    // PostgreSQL backup command
    const dbUrl = process.env.DATABASE_URL;
    const pgDumpCommand = `pg_dump "${dbUrl}" > "${backupPath}"`;
    
    exec(pgDumpCommand, (error, stdout, stderr) => {
      if (error) {
        console.error('Backup error:', error);
        return res.status(500).json({ error: 'Failed to create backup' });
      }
      
      // Send file as download
      res.download(backupPath, backupFileName, (err) => {
        if (err) {
          console.error('Download error:', err);
          return res.status(500).json({ error: 'Failed to download backup' });
        }
        
        // Clean up backup file after download
        setTimeout(() => {
          if (fs.existsSync(backupPath)) {
            fs.unlinkSync(backupPath);
          }
        }, 5000);
      });
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
    
    // PostgreSQL restore command
    const dbUrl = process.env.DATABASE_URL;
    const psqlCommand = `psql "${dbUrl}" < "${backupFilePath}"`;
    
    exec(psqlCommand, (error, stdout, stderr) => {
      // Clean up uploaded file
      if (fs.existsSync(backupFilePath)) {
        fs.unlinkSync(backupFilePath);
      }
      
      if (error) {
        console.error('Restore error:', error);
        return res.status(500).json({ error: 'Failed to restore backup' });
      }
      
      res.json({ success: true, message: 'Database restored successfully' });
    });
    
  } catch (error) {
    console.error('Restore error:', error);
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Failed to restore backup' });
  }
});

export default router;