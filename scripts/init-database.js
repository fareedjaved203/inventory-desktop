import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { migrateData } from './migrate-from-sqlite.js';

const prisma = new PrismaClient();

async function initializeDatabase() {
  try {
    console.log('Initializing PostgreSQL database...');
    
    // Run Prisma migrations
    console.log('Running database migrations...');
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    
    // Generate Prisma client
    console.log('Generating Prisma client...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    
    // Migrate existing SQLite data if available
    console.log('Checking for existing SQLite data to migrate...');
    await migrateData();
    
    console.log('Database initialized successfully!');
    
  } catch (error) {
    console.error('Database initialization failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

initializeDatabase();