import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { migrateData } from './migrate-from-sqlite.js';

async function checkAndMigrate() {
  try {
    const userDataPath = process.env.ELECTRON_USER_DATA || process.cwd();
    const sqliteDbPath = path.join(userDataPath, 'inventory.db');
    
    // Check if SQLite database exists
    if (fs.existsSync(sqliteDbPath)) {
      console.log('SQLite database found. Checking PostgreSQL status...');
      
      // Check if PostgreSQL is running
      try {
        execSync('pg_isready -h localhost -p 5432', { stdio: 'pipe' });
        console.log('PostgreSQL is running. Starting migration...');
        
        // Run PostgreSQL setup if needed
        try {
          execSync('psql -U postgres -h localhost -c "SELECT 1" -d hisabghar', { 
            stdio: 'pipe',
            env: { ...process.env, PGPASSWORD: 'postgres' }
          });
          console.log('Database already exists');
        } catch {
          console.log('Creating database...');
          execSync('psql -U postgres -h localhost -c "CREATE DATABASE hisabghar;"', {
            stdio: 'pipe',
            env: { ...process.env, PGPASSWORD: 'postgres' }
          });
          execSync('psql -U postgres -h localhost -c "CREATE USER hisabghar WITH PASSWORD \'hisabghar123\';"', {
            stdio: 'pipe',
            env: { ...process.env, PGPASSWORD: 'postgres' }
          });
          execSync('psql -U postgres -h localhost -c "GRANT ALL PRIVILEGES ON DATABASE hisabghar TO hisabghar;"', {
            stdio: 'pipe',
            env: { ...process.env, PGPASSWORD: 'postgres' }
          });
        }
        
        // Run migrations
        execSync('npx prisma migrate deploy', { stdio: 'inherit' });
        execSync('npx prisma generate', { stdio: 'inherit' });
        
        // Migrate data
        await migrateData();
        
        // Backup SQLite file
        const backupPath = path.join(userDataPath, `inventory_backup_${Date.now()}.db`);
        fs.copyFileSync(sqliteDbPath, backupPath);
        console.log(`SQLite database backed up to: ${backupPath}`);
        
        console.log('Migration completed successfully!');
        
      } catch (error) {
        console.log('PostgreSQL not available, installing...');
        
        // Install PostgreSQL
        const setupScript = path.join(process.cwd(), 'scripts', 'setup-postgres.bat');
        if (fs.existsSync(setupScript)) {
          execSync(`"${setupScript}"`, { stdio: 'inherit' });
          
          // Retry migration after installation
          await checkAndMigrate();
        } else {
          console.log('PostgreSQL setup script not found. Using SQLite for now.');
        }
      }
    } else {
      console.log('No SQLite database found. Using PostgreSQL from start.');
      
      // Ensure PostgreSQL is set up for new installations
      try {
        execSync('pg_isready -h localhost -p 5432', { stdio: 'pipe' });
      } catch {
        const setupScript = path.join(process.cwd(), 'scripts', 'setup-postgres.bat');
        if (fs.existsSync(setupScript)) {
          execSync(`"${setupScript}"`, { stdio: 'inherit' });
        }
      }
    }
    
  } catch (error) {
    console.error('Migration check failed:', error.message);
    // Don't fail the app startup, just log the error
  }
}

export { checkAndMigrate };