import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEMO_EMAIL = 'demo@gmail.com';

// Helper function to generate random dates
const randomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Helper function to generate random amounts
const randomAmount = (min, max) => {
  return BigInt(Math.floor(Math.random() * (max - min + 1)) + min);
};

async function seedDemoData() {
  try {
    console.log('Starting demo data seeding...');

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
    console.log('Updating demo user license...');
    const licenseExpiry = Math.floor(new Date('2025-12-31').getTime() / 1000); // 1 year from now
    await prisma.license.upsert({
      where: { userId: demoUser.id },
      update: {
        licenseKey: '7FB2-8CE9-01E1-3380-41FC',
        deviceFingerprint: 'demo-device-fingerprint',
        expiry: BigInt(licenseExpiry),
        duration: '1_YEAR',
        isTrial: false,
        activatedAt: new Date()
      },
      create: {
        userId: demoUser.id,
        licenseKey: '7FB2-8CE9-01E1-3380-41FC',
        deviceFingerprint: 'demo-device-fingerprint',
        expiry: BigInt(licenseExpiry),
        duration: '1_YEAR',
        isTrial: false,
        activatedAt: new Date()
      }
    });

    // Clear ALL existing data for demo user (complete wipe except User and License)
    console.log('Wiping all demo user data...');
    
    // Delete all employees with demo emails globally to avoid conflicts
    await prisma.employee.deleteMany({ 
      where: { 
        email: { 
          contains: '@autos.com' 
        } 
      } 
    });
    
    // Get all sales for this user first
    const userSales = await prisma.sale.findMany({
      where: { userId: demoUser.id },
      select: { id: true }
    });
    const saleIds = userSales.map(sale => sale.id);
    
    // Get all bulk purchases for this user
    const userBulkPurchases = await prisma.bulkPurchase.findMany({
      where: { userId: demoUser.id },
      select: { id: true }
    });
    const bulkPurchaseIds = userBulkPurchases.map(bp => bp.id);
    
    // Get all sale returns for this user
    const userSaleReturns = await prisma.saleReturn.findMany({
      where: { userId: demoUser.id },
      select: { id: true }
    });
    const saleReturnIds = userSaleReturns.map(sr => sr.id);
    
    // Delete in correct order to handle foreign key constraints
    if (saleReturnIds.length > 0) {
      await prisma.saleReturnItem.deleteMany({ where: { saleReturnId: { in: saleReturnIds } } });
    }
    await prisma.saleReturn.deleteMany({ where: { userId: demoUser.id } });
    
    if (saleIds.length > 0) {
      await prisma.saleItem.deleteMany({ where: { saleId: { in: saleIds } } });
    }
    await prisma.sale.deleteMany({ where: { userId: demoUser.id } });
    
    if (bulkPurchaseIds.length > 0) {
      await prisma.bulkPurchaseItem.deleteMany({ where: { bulkPurchaseId: { in: bulkPurchaseIds } } });
    }
    await prisma.bulkPurchase.deleteMany({ where: { userId: demoUser.id } });
    await prisma.loanTransaction.deleteMany({ where: { userId: demoUser.id } });
    await prisma.expense.deleteMany({ where: { userId: demoUser.id } });
    await prisma.branch.deleteMany({ where: { userId: demoUser.id } });
    await prisma.contact.deleteMany({ where: { userId: demoUser.id } });
    await prisma.manufacturing.deleteMany({ where: { userId: demoUser.id } });
    await prisma.recipeItem.deleteMany({ where: { recipe: { userId: demoUser.id } } });
    await prisma.recipe.deleteMany({ where: { userId: demoUser.id } });
    await prisma.product.deleteMany({ where: { userId: demoUser.id } });
    await prisma.category.deleteMany({ where: { userId: demoUser.id } });
    await prisma.shopSettings.deleteMany({ where: { userId: demoUser.id } });
    
    console.log('All demo user data cleared successfully.');

    // 1. Create Branches (5 branches)
    console.log('Creating branches...');
    const branches = [];
    const branchNames = ['Auto Main Showroom', 'Auto Service Center', 'Auto Parts Warehouse', 'Auto Body Shop', 'Auto Online Store'];
    for (let i = 0; i < 5; i++) {
      const branch = await prisma.branch.create({
        data: {
          name: `${branchNames[i]} - ${demoUser.id.substring(0, 8)}`,
          code: `AUTO${demoUser.id.substring(0, 4)}${String(i + 1).padStart(3, '0')}`,
          location: `Location ${i + 1}, City`,
          userId: demoUser.id,
          createdAt: randomDate(new Date(2023, 0, 1), new Date())
        }
      });
      branches.push(branch);
    }

    // 2. Create Employees (30 employees)
    console.log('Creating employees...');
    const employees = [];
    const firstNames = ['Ahmed', 'Ali', 'Hassan', 'Fatima', 'Aisha', 'Omar', 'Zainab', 'Usman', 'Khadija', 'Ibrahim'];
    const lastNames = ['Khan', 'Ahmed', 'Ali', 'Sheikh', 'Malik', 'Hussain', 'Qureshi', 'Siddiqui', 'Chaudhry', 'Butt'];
    
    for (let i = 0; i < 30; i++) {
      const firstName = firstNames[i % firstNames.length];
      const lastName = lastNames[i % lastNames.length];
      const employee = await prisma.employee.create({
        data: {
          firstName,
          lastName,
          phone: `+92300${String(1000000 + i).substring(1)}`,
          email: `employee${i + 1}.${demoUser.id.substring(0, 8)}@autos.com`,
          password: '$2a$10$hashedpassword', // placeholder hash
          permissions: JSON.stringify(['pos', 'inventory']),
          branchId: branches[i % branches.length].id,
          userId: demoUser.id,
          createdAt: randomDate(new Date(2023, 0, 1), new Date())
        }
      });
      employees.push(employee);
    }

    // 3. Create Contacts (30 contacts - mix of customers and suppliers)
    console.log('Creating contacts...');
    const contacts = [];
    const contactNames = [
      'Toyota Motors', 'Honda Dealership', 'Suzuki Parts', 'Hyundai Service', 'KIA Motors',
      'Auto Parts Plus', 'Speed Motors', 'Car Care Center', 'Elite Motors', 'Prime Auto',
      'Ahmad Ali', 'Fatima Khan', 'Hassan Sheikh', 'Aisha Malik', 'Omar Hussain',
      'Zainab Qureshi', 'Usman Siddiqui', 'Khadija Butt', 'Ibrahim Chaudhry', 'Ali Ahmed',
      'Fast Track Motors', 'Auto Zone', 'Car Mart', 'Speed Shop', 'Motor World',
      'Auto Hub', 'Car Palace', 'Motor Plaza', 'Auto Center', 'Car Kingdom'
    ];

    for (let i = 0; i < 30; i++) {
      const contact = await prisma.contact.create({
        data: {
          name: contactNames[i],
          address: `Address ${i + 1}, Street ${i + 1}, City`,
          phoneNumber: `+92300${String(2000000 + i).substring(1)}`,
          contactType: i < 15 ? 'customer' : 'supplier',
          userId: demoUser.id,
          createdAt: randomDate(new Date(2023, 0, 1), new Date())
        }
      });
      contacts.push(contact);
    }

    // 4. Create Categories (5 categories)
    console.log('Creating categories...');
    const categories = [];
    const categoryData = [
      { name: 'Engine Parts', icon: '🔧', color: '#EF4444' },
      { name: 'Brake System', icon: '🛑', color: '#F97316' },
      { name: 'Electrical', icon: '⚡', color: '#EAB308' },
      { name: 'Filters', icon: '🔍', color: '#22C55E' },
      { name: 'Accessories', icon: '✨', color: '#3B82F6' }
    ];

    for (const cat of categoryData) {
      const category = await prisma.category.create({
        data: {
          name: cat.name,
          description: `${cat.name} for automotive`,
          icon: cat.icon,
          color: cat.color,
          userId: demoUser.id
        }
      });
      categories.push(category);
    }

    // 5. Create Products (30 products with varied stock levels)
    console.log('Creating products...');
    const products = [];
    const productData = [
      { name: 'Engine Oil 5W-30', price: 3500, purchasePrice: 2800, quantity: 50, lowStock: 20, category: 0, isRaw: false },
      { name: 'Brake Pads Set', price: 8000, purchasePrice: 6500, quantity: 15, lowStock: 10, category: 1, isRaw: false },
      { name: 'Air Filter', price: 2500, purchasePrice: 2000, quantity: 30, lowStock: 15, category: 3, isRaw: false },
      { name: 'Spark Plugs Set', price: 4500, purchasePrice: 3500, quantity: 25, lowStock: 12, category: 0, isRaw: false },
      { name: 'Car Battery 12V', price: 18000, purchasePrice: 15000, quantity: 8, lowStock: 5, category: 2, isRaw: false },
      { name: 'Tire 185/65R15', price: 12000, purchasePrice: 9500, quantity: 20, lowStock: 8, category: 4, isRaw: false },
      { name: 'Headlight Bulb H4', price: 1500, purchasePrice: 1200, quantity: 40, lowStock: 20, category: 2, isRaw: false },
      { name: 'Windshield Wipers', price: 2000, purchasePrice: 1600, quantity: 35, lowStock: 15, category: 4, isRaw: false },
      { name: 'Radiator Coolant', price: 1800, purchasePrice: 1400, quantity: 45, lowStock: 25, category: 0, isRaw: false },
      { name: 'Clutch Plate', price: 15000, purchasePrice: 12000, quantity: 6, lowStock: 4, category: 0, isRaw: false },
      { name: 'Shock Absorber', price: 8500, purchasePrice: 7000, quantity: 12, lowStock: 6, category: 0, isRaw: false },
      { name: 'Fuel Filter', price: 1200, purchasePrice: 900, quantity: 60, lowStock: 30, category: 3, isRaw: false },
      { name: 'Alternator Belt', price: 2200, purchasePrice: 1800, quantity: 25, lowStock: 12, category: 0, isRaw: false },
      { name: 'Car Jack 2 Ton', price: 5500, purchasePrice: 4500, quantity: 10, lowStock: 5, category: 4, isRaw: false },
      { name: 'Side Mirror Left', price: 4500, purchasePrice: 3600, quantity: 8, lowStock: 4, category: 4, isRaw: false },
      { name: 'Exhaust Pipe', price: 12000, purchasePrice: 9500, quantity: 5, lowStock: 3, category: 0, isRaw: false },
      { name: 'Gear Oil', price: 2800, purchasePrice: 2200, quantity: 30, lowStock: 15, category: 0, isRaw: false },
      { name: 'Carburetor Kit', price: 6500, purchasePrice: 5200, quantity: 12, lowStock: 6, category: 0, isRaw: false },
      { name: 'Timing Belt', price: 4200, purchasePrice: 3400, quantity: 18, lowStock: 10, category: 0, isRaw: false },
      { name: 'Water Pump', price: 9500, purchasePrice: 7600, quantity: 7, lowStock: 4, category: 0, isRaw: false },
      { name: 'Brake Fluid DOT 4', price: 800, purchasePrice: 600, quantity: 80, lowStock: 40, category: 1, isRaw: false },
      { name: 'Car Polish Wax', price: 1500, purchasePrice: 1200, quantity: 50, lowStock: 25, category: 4, isRaw: false },
      { name: 'Seat Covers Set', price: 3500, purchasePrice: 2800, quantity: 15, lowStock: 8, category: 4, isRaw: false },
      { name: 'Floor Mats Rubber', price: 2500, purchasePrice: 2000, quantity: 20, lowStock: 10, category: 4, isRaw: false },
      { name: 'Car Perfume', price: 500, purchasePrice: 350, quantity: 100, lowStock: 50, category: 4, isRaw: false },
      { name: 'Steering Wheel Cover', price: 1200, purchasePrice: 900, quantity: 35, lowStock: 18, category: 4, isRaw: false },
      { name: 'Car Charger USB', price: 800, purchasePrice: 600, quantity: 60, lowStock: 30, category: 2, isRaw: false },
      { name: 'Jumper Cables', price: 2200, purchasePrice: 1800, quantity: 15, lowStock: 8, category: 2, isRaw: false },
      { name: 'Tool Kit 21 Pcs', price: 4500, purchasePrice: 3600, quantity: 12, lowStock: 6, category: 4, isRaw: false },
      { name: 'Car Vacuum Cleaner', price: 8500, purchasePrice: 7000, quantity: 8, lowStock: 4, category: 4, isRaw: false },
      // Raw materials for manufacturing
      { name: 'Steel Sheet Raw', price: 5000, purchasePrice: 4000, quantity: 100, lowStock: 20, category: 0, isRaw: true },
      { name: 'Rubber Compound', price: 2000, purchasePrice: 1500, quantity: 200, lowStock: 50, category: 1, isRaw: true },
      { name: 'Plastic Pellets', price: 1500, purchasePrice: 1200, quantity: 300, lowStock: 75, category: 4, isRaw: true },
      { name: 'Copper Wire Raw', price: 8000, purchasePrice: 6500, quantity: 50, lowStock: 10, category: 2, isRaw: true },
      { name: 'Filter Paper Roll', price: 3000, purchasePrice: 2400, quantity: 80, lowStock: 20, category: 3, isRaw: true }
    ];

    for (let i = 0; i < productData.length; i++) {
      const data = productData[i];
      const product = await prisma.product.create({
        data: {
          name: data.name,
          description: `High quality ${data.name} with warranty`,
          price: BigInt(data.price),
          purchasePrice: BigInt(data.purchasePrice),
          retailPrice: BigInt(data.price),
          wholesalePrice: BigInt(Math.floor(data.price * 0.9)),
          perUnitPurchasePrice: BigInt(Math.floor(data.purchasePrice / data.quantity)),
          sku: `SKU${String(i + 1).padStart(4, '0')}`,
          quantity: BigInt(data.quantity),
          lowStockThreshold: BigInt(data.lowStock),
          unit: 'pcs',
          isRawMaterial: data.isRaw,
          categoryId: categories[data.category].id,
          userId: demoUser.id,
          createdAt: randomDate(new Date(2023, 0, 1), new Date())
        }
      });
      products.push(product);
    }

    // 6. Create Recipes and Manufacturing (5 recipes)
    console.log('Creating recipes and manufacturing...');
    const rawMaterials = products.filter(p => p.isRawMaterial);
    const finishedProducts = products.filter(p => !p.isRawMaterial).slice(0, 5);
    
    for (let i = 0; i < 5; i++) {
      const finishedProduct = finishedProducts[i];
      
      // Create recipe
      const recipe = await prisma.recipe.create({
        data: {
          name: `Recipe for ${finishedProduct.name}`,
          description: `Manufacturing recipe for ${finishedProduct.name}`,
          productId: finishedProduct.id,
          userId: demoUser.id
        }
      });
      
      // Add 2-3 raw materials to each recipe
      const ingredientCount = Math.floor(Math.random() * 2) + 2;
      for (let j = 0; j < ingredientCount; j++) {
        const rawMaterial = rawMaterials[j % rawMaterials.length];
        await prisma.recipeItem.create({
          data: {
            recipeId: recipe.id,
            rawMaterialId: rawMaterial.id,
            quantity: randomAmount(1, 5),
            unit: 'pcs'
          }
        });
      }
      
      // Create manufacturing records
      for (let k = 0; k < 2; k++) {
        await prisma.manufacturing.create({
          data: {
            recipeId: recipe.id,
            quantityProduced: randomAmount(5, 20),
            manufacturingCost: randomAmount(1000, 5000),
            productionDate: randomDate(new Date(2023, 6, 1), new Date()),
            notes: `Production batch ${k + 1} for ${finishedProduct.name}`,
            userId: demoUser.id
          }
        });
      }
    }

    // 7. Create Bulk Purchases (15 purchases)
    console.log('Creating bulk purchases...');
    const suppliers = contacts.filter(c => c.contactType === 'supplier');
    for (let i = 0; i < 15; i++) {
      const purchaseDate = randomDate(new Date(2023, 0, 1), new Date());
      const totalAmount = randomAmount(50000, 500000);
      const paidAmount = i % 3 === 0 ? totalAmount : randomAmount(20000, Number(totalAmount));
      
      const purchase = await prisma.bulkPurchase.create({
        data: {
          invoiceNumber: `AUTO-INV-${demoUser.id.substring(0, 4)}-${String(i + 1).padStart(4, '0')}`,
          totalAmount,
          paidAmount,
          purchaseDate,
          contactId: suppliers[i % suppliers.length].id,
          userId: demoUser.id,
          createdAt: purchaseDate
        }
      });

      // Add 2-4 items per purchase
      const itemCount = Math.floor(Math.random() * 3) + 2;
      for (let j = 0; j < itemCount; j++) {
        const product = products[Math.floor(Math.random() * products.length)];
        await prisma.bulkPurchaseItem.create({
          data: {
            quantity: randomAmount(5, 50),
            purchasePrice: BigInt(Number(product.purchasePrice)),
            bulkPurchaseId: purchase.id,
            productId: product.id
          }
        });
      }
    }

    // 8. Create Sales (30 sales)
    console.log('Creating sales...');
    const customers = contacts.filter(c => c.contactType === 'customer');
    for (let i = 0; i < 30; i++) {
      const saleDate = randomDate(new Date(2023, 6, 1), new Date());
      const totalAmount = randomAmount(5000, 100000);
      const paidAmount = i % 4 === 0 ? randomAmount(1000, Number(totalAmount) - 1000) : totalAmount;
      
      const sale = await prisma.sale.create({
        data: {
          billNumber: `AUTO-BILL-${demoUser.id.substring(0, 4)}-${String(i + 1).padStart(6, '0')}`,
          totalAmount,
          originalTotalAmount: totalAmount,
          paidAmount,
          discount: randomAmount(0, 5000),
          saleDate,
          contactId: i % 3 === 0 ? customers[i % customers.length].id : null,
          employeeId: employees[i % employees.length].id,
          userId: demoUser.id,
          createdAt: saleDate
        }
      });

      // Add 1-3 items per sale
      const itemCount = Math.floor(Math.random() * 3) + 1;
      for (let j = 0; j < itemCount; j++) {
        const product = products[Math.floor(Math.random() * products.length)];
        await prisma.saleItem.create({
          data: {
            quantity: randomAmount(1, 5),
            price: BigInt(Number(product.price)),
            purchasePrice: BigInt(Number(product.purchasePrice)),
            saleId: sale.id,
            productId: product.id,
            priceType: Math.random() > 0.7 ? 'wholesale' : 'retail'
          }
        });
      }
    }

    // 9. Create Returns (10 returns)
    console.log('Creating returns...');
    const sales = await prisma.sale.findMany({ where: { userId: demoUser.id } });
    for (let i = 0; i < 10; i++) {
      const sale = sales[i];
      const returnDate = new Date(sale.saleDate.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000);
      const totalAmount = randomAmount(1000, Number(sale.totalAmount) / 2);
      
      const saleReturn = await prisma.saleReturn.create({
        data: {
          returnNumber: `AUTO-RET-${demoUser.id.substring(0, 4)}-${String(i + 1).padStart(4, '0')}`,
          totalAmount,
          returnDate,
          reason: ['Defective', 'Wrong item', 'Customer changed mind', 'Damaged'][i % 4],
          refundAmount: totalAmount,
          refundPaid: i % 2 === 0,
          refundDate: i % 2 === 0 ? returnDate : null,
          saleId: sale.id,
          userId: demoUser.id
        }
      });

      // Add return items
      const saleItems = await prisma.saleItem.findMany({ where: { saleId: sale.id } });
      if (saleItems.length > 0) {
        const item = saleItems[0];
        await prisma.saleReturnItem.create({
          data: {
            quantity: randomAmount(1, Number(item.quantity)),
            price: BigInt(Number(item.price)),
            saleReturnId: saleReturn.id,
            productId: item.productId
          }
        });
      }
    }

    // 10. Create Expenses (30 expenses)
    console.log('Creating expenses...');
    const expenseCategories = ['Showroom Rent', 'Utilities', 'Marketing', 'Office Supplies', 'Transportation', 'Equipment Maintenance', 'Insurance', 'Staff Salary'];
    for (let i = 0; i < 30; i++) {
      await prisma.expense.create({
        data: {
          amount: randomAmount(5000, 50000),
          date: randomDate(new Date(2023, 0, 1), new Date()),
          category: expenseCategories[i % expenseCategories.length],
          description: `${expenseCategories[i % expenseCategories.length]} expense for month`,
          paymentMethod: ['Cash', 'Bank Transfer', 'Credit Card'][i % 3],
          receiptNumber: `RCP-${String(i + 1).padStart(4, '0')}`,
          contactId: i % 5 === 0 ? contacts[i % contacts.length].id : null,
          userId: demoUser.id
        }
      });
    }

    // 11. Create Loan Transactions (20 transactions)
    console.log('Creating loan transactions...');
    for (let i = 0; i < 20; i++) {
      await prisma.loanTransaction.create({
        data: {
          amount: randomAmount(10000, 200000),
          type: i % 2 === 0 ? 'given' : 'received',
          description: i % 2 === 0 ? 'Loan given to customer' : 'Loan received from supplier',
          date: randomDate(new Date(2023, 0, 1), new Date()),
          contactId: contacts[i % contacts.length].id,
          userId: demoUser.id
        }
      });
    }

    // 12. Create Shop Settings
    console.log('Creating shop settings...');
    await prisma.shopSettings.create({
      data: {
        email: DEMO_EMAIL,
        shopName: 'AutoParts Plus',
        shopDescription: 'Your trusted automotive partner',
        shopDescription2: 'Quality auto parts, competitive prices',
        userName1: 'Muhammad Ahmed',
        userPhone1: '+92300-1234567',
        userName2: 'Ali Hassan',
        userPhone2: '+92301-2345678',
        userName3: 'Fatima Khan',
        userPhone3: '+92302-3456789',
        brand1: 'AutoMart',
        brand1Registered: true,
        brand2: 'CarHub',
        brand2Registered: false,
        brand3: 'MotorWorld',
        brand3Registered: true,
        userId: demoUser.id
      }
    });

    console.log('Demo data seeding completed successfully!');
    console.log('Summary:');
    console.log('- License activated with key: 7FB2-8CE9-01E1-3380-41FC');
    console.log('- 5 Product Categories');
    console.log('- 5 Branches');
    console.log('- 30 Employees');
    console.log('- 30 Contacts (15 customers, 15 suppliers)');
    console.log('- 35 Products (30 finished + 5 raw materials)');
    console.log('- 5 Manufacturing Recipes with ingredients');
    console.log('- 10 Manufacturing Records');
    console.log('- 15 Bulk Purchases with items');
    console.log('- 30 Sales with items');
    console.log('- 10 Returns with items');
    console.log('- 30 Expenses');
    console.log('- 20 Loan Transactions');
    console.log('- 1 Shop Settings');

  } catch (error) {
    console.error('Error seeding demo data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedDemoData();