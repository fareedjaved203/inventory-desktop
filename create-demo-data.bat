@echo off
echo ========================================
echo    HISAB GHAR - Demo Data Setup
echo ========================================
echo.
echo This script will:
echo - Create demo user (demo@gmail.com / demo)
echo - Populate sample data for all entities
echo - Set up a complete demo environment
echo.
echo Demo Credentials:
echo Email: demo@gmail.com
echo Password: demo
echo.
pause

cd /d "%~dp0"

echo.
echo [1/3] Creating demo user account...
node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createDemoUser() {
  try {
    const email = 'demo@gmail.com';
    const password = 'demo';
    
    // Check if demo user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      console.log('✓ Demo user already exists');
      return;
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const demoUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'admin',
        companyName: 'Demo Company',
        trialEndDate: new Date('2025-12-31')
      }
    });
    
    console.log('✓ Demo user created successfully:', demoUser.email);
  } catch (error) {
    console.error('✗ Error creating demo user:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createDemoUser();
"

if %errorlevel% neq 0 (
    echo ✗ Failed to create demo user
    pause
    exit /b 1
)

echo.
echo [2/3] Setting up database and dependencies...
cd backend
call npm install --silent
if %errorlevel% neq 0 (
    echo ✗ Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo [3/3] Populating demo data...
echo This may take a few minutes...
node seed-demo-data.js

if %errorlevel% neq 0 (
    echo ✗ Failed to populate demo data
    pause
    exit /b 1
)

cd ..

echo.
echo ========================================
echo    DEMO DATA SETUP COMPLETED!
echo ========================================
echo.
echo Demo Account Created:
echo   Email: demo@gmail.com
echo   Password: demo
echo   License Key: 7FB2-8CE9-01E1-3380-41FC
echo.
echo Sample Data Populated:
echo   ✓ 5 Product Categories
echo   ✓ 5 Branches
echo   ✓ 30 Employees  
echo   ✓ 30 Contacts (15 customers, 15 suppliers)
echo   ✓ 30 Products (with categories, pricing, stock)
echo   ✓ 15 Bulk Purchases with items
echo   ✓ 30 Sales transactions with items
echo   ✓ 10 Return transactions with items
echo   ✓ 30 Expense records
echo   ✓ 20 Loan transactions
echo   ✓ 5 Manufacturing recipes
echo   ✓ 10 Manufacturing records
echo   ✓ Shop settings configured
echo   ✓ License activated
echo   ✓ Audit trail records
echo.
echo You can now:
echo 1. Start the application
echo 2. Login with demo@gmail.com / demo
echo 3. Explore all features with sample data
echo.
echo Note: This demo data includes realistic automotive 
echo business scenarios with proper relationships between
echo all entities for comprehensive testing.
echo.
pause