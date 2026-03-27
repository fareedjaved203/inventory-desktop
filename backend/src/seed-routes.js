import { authenticateToken } from './middleware.js';
import crypto from 'crypto';

const randomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
const randomAmount = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export function setupSeedRoutes(app, prisma) {
  app.post('/api/seed-demo-data', authenticateToken, async (req, res) => {
    try {
      const userId = req.userId;

      // Wipe any partial/existing data for this user first (makes it safe to retry)
      const sales = await prisma.sale.findMany({ where: { userId }, select: { id: true } });
      const saleIds = sales.map(s => s.id);
      const returns = await prisma.saleReturn.findMany({ where: { userId }, select: { id: true } });
      const returnIds = returns.map(r => r.id);
      const purchases = await prisma.bulkPurchase.findMany({ where: { userId }, select: { id: true } });
      const purchaseIds = purchases.map(p => p.id);
      if (returnIds.length) await prisma.saleReturnItem.deleteMany({ where: { saleReturnId: { in: returnIds } } });
      await prisma.saleReturn.deleteMany({ where: { userId } });
      if (saleIds.length) await prisma.saleItem.deleteMany({ where: { saleId: { in: saleIds } } });
      await prisma.sale.deleteMany({ where: { userId } });
      if (purchaseIds.length) await prisma.bulkPurchaseItem.deleteMany({ where: { bulkPurchaseId: { in: purchaseIds } } });
      await prisma.bulkPurchase.deleteMany({ where: { userId } });
      await prisma.loanTransaction.deleteMany({ where: { userId } });
      await prisma.expense.deleteMany({ where: { userId } });
      await prisma.manufacturing.deleteMany({ where: { userId } });
      await prisma.recipeItem.deleteMany({ where: { recipe: { userId } } });
      await prisma.recipe.deleteMany({ where: { userId } });
      await prisma.employee.deleteMany({ where: { userId } });
      await prisma.branch.deleteMany({ where: { userId } });
      await prisma.contact.deleteMany({ where: { userId } });
      await prisma.product.deleteMany({ where: { userId } });
      await prisma.category.deleteMany({ where: { userId } });
      await prisma.shopSettings.deleteMany({ where: { userId } });

      // ── Categories (8) ──
      const catDefs = [
        { name: 'Engine Parts', icon: '🔧', color: '#EF4444' },
        { name: 'Brake System', icon: '🛑', color: '#F97316' },
        { name: 'Electrical & Lighting', icon: '⚡', color: '#EAB308' },
        { name: 'Filters & Fluids', icon: '🔍', color: '#22C55E' },
        { name: 'Body & Exterior', icon: '🚗', color: '#3B82F6' },
        { name: 'Interior & Comfort', icon: '💺', color: '#8B5CF6' },
        { name: 'Tires & Wheels', icon: '🛞', color: '#EC4899' },
        { name: 'Tools & Equipment', icon: '🧰', color: '#14B8A6' },
      ];
      const categories = [];
      for (const c of catDefs) {
        categories.push(await prisma.category.create({ data: { ...c, description: `${c.name} category`, userId } }));
      }

      // ── Products (50 finished + 8 raw materials) ──
      const prodDefs = [
        // Engine Parts (cat 0)
        { name: 'Engine Oil 5W-30 (4L)', p: 3500, pp: 2800, q: 120, ls: 30, ci: 0 },
        { name: 'Engine Oil 10W-40 (4L)', p: 3200, pp: 2500, q: 90, ls: 25, ci: 0 },
        { name: 'Spark Plugs Set (4pc)', p: 4500, pp: 3500, q: 65, ls: 20, ci: 0 },
        { name: 'Timing Belt Kit', p: 8500, pp: 6800, q: 18, ls: 8, ci: 0 },
        { name: 'Water Pump Assembly', p: 9500, pp: 7600, q: 12, ls: 5, ci: 0 },
        { name: 'Clutch Plate Set', p: 15000, pp: 12000, q: 10, ls: 4, ci: 0 },
        { name: 'Piston Ring Set', p: 6500, pp: 5200, q: 22, ls: 8, ci: 0 },
        { name: 'Valve Cover Gasket', p: 2200, pp: 1700, q: 35, ls: 12, ci: 0 },
        { name: 'Alternator Belt', p: 2200, pp: 1800, q: 40, ls: 15, ci: 0 },
        { name: 'Radiator Hose Upper', p: 1800, pp: 1400, q: 30, ls: 10, ci: 0 },
        // Brake System (cat 1)
        { name: 'Brake Pads Front Set', p: 8000, pp: 6500, q: 45, ls: 15, ci: 1 },
        { name: 'Brake Pads Rear Set', p: 7500, pp: 6000, q: 40, ls: 12, ci: 1 },
        { name: 'Brake Disc Rotor Front', p: 12000, pp: 9500, q: 16, ls: 6, ci: 1 },
        { name: 'Brake Fluid DOT 4 (1L)', p: 800, pp: 600, q: 150, ls: 50, ci: 1 },
        { name: 'Brake Caliper Assembly', p: 18000, pp: 14500, q: 8, ls: 3, ci: 1 },
        { name: 'Handbrake Cable', p: 3500, pp: 2800, q: 20, ls: 8, ci: 1 },
        // Electrical (cat 2)
        { name: 'Car Battery 12V 60Ah', p: 18000, pp: 15000, q: 14, ls: 5, ci: 2 },
        { name: 'Headlight Bulb H4 (pair)', p: 1500, pp: 1200, q: 80, ls: 30, ci: 2 },
        { name: 'LED Fog Light Kit', p: 5500, pp: 4200, q: 25, ls: 10, ci: 2 },
        { name: 'Alternator 12V', p: 22000, pp: 18000, q: 6, ls: 3, ci: 2 },
        { name: 'Starter Motor', p: 25000, pp: 20000, q: 5, ls: 2, ci: 2 },
        { name: 'Fuse Box Complete', p: 3500, pp: 2800, q: 18, ls: 8, ci: 2 },
        { name: 'Car Charger USB Dual', p: 800, pp: 600, q: 100, ls: 40, ci: 2 },
        // Filters & Fluids (cat 3)
        { name: 'Air Filter Standard', p: 2500, pp: 2000, q: 70, ls: 25, ci: 3 },
        { name: 'Oil Filter Premium', p: 1200, pp: 900, q: 90, ls: 35, ci: 3 },
        { name: 'Fuel Filter Inline', p: 1500, pp: 1100, q: 55, ls: 20, ci: 3 },
        { name: 'Cabin Air Filter', p: 1800, pp: 1400, q: 45, ls: 18, ci: 3 },
        { name: 'Radiator Coolant (4L)', p: 2200, pp: 1700, q: 60, ls: 20, ci: 3 },
        { name: 'Power Steering Fluid', p: 1200, pp: 900, q: 50, ls: 20, ci: 3 },
        { name: 'Gear Oil 80W-90 (1L)', p: 1400, pp: 1100, q: 65, ls: 25, ci: 3 },
        // Body & Exterior (cat 4)
        { name: 'Side Mirror Left', p: 4500, pp: 3600, q: 12, ls: 5, ci: 4 },
        { name: 'Side Mirror Right', p: 4500, pp: 3600, q: 12, ls: 5, ci: 4 },
        { name: 'Windshield Wipers (pair)', p: 2000, pp: 1600, q: 50, ls: 20, ci: 4 },
        { name: 'Bumper Front', p: 35000, pp: 28000, q: 4, ls: 2, ci: 4 },
        { name: 'Door Handle Chrome', p: 2800, pp: 2200, q: 20, ls: 8, ci: 4 },
        { name: 'Exhaust Pipe Assembly', p: 15000, pp: 12000, q: 6, ls: 3, ci: 4 },
        // Interior (cat 5)
        { name: 'Seat Covers Leather Set', p: 8500, pp: 6800, q: 15, ls: 6, ci: 5 },
        { name: 'Floor Mats Rubber Set', p: 2500, pp: 2000, q: 30, ls: 12, ci: 5 },
        { name: 'Steering Wheel Cover', p: 1200, pp: 900, q: 45, ls: 18, ci: 5 },
        { name: 'Car Perfume Premium', p: 500, pp: 350, q: 200, ls: 80, ci: 5 },
        { name: 'Sun Visor Organizer', p: 1500, pp: 1100, q: 35, ls: 15, ci: 5 },
        // Tires (cat 6)
        { name: 'Tire 185/65R15', p: 12000, pp: 9500, q: 24, ls: 8, ci: 6 },
        { name: 'Tire 195/65R15', p: 13500, pp: 10800, q: 20, ls: 8, ci: 6 },
        { name: 'Alloy Wheel 15"', p: 18000, pp: 14500, q: 8, ls: 4, ci: 6 },
        { name: 'Wheel Nut Set (20pc)', p: 2500, pp: 2000, q: 30, ls: 12, ci: 6 },
        // Tools (cat 7)
        { name: 'Tool Kit 21 Pcs', p: 4500, pp: 3600, q: 18, ls: 8, ci: 7 },
        { name: 'Car Jack 2 Ton', p: 5500, pp: 4500, q: 14, ls: 5, ci: 7 },
        { name: 'Jumper Cables Heavy', p: 2200, pp: 1800, q: 25, ls: 10, ci: 7 },
        { name: 'Tire Pressure Gauge', p: 800, pp: 600, q: 60, ls: 25, ci: 7 },
        { name: 'Car Vacuum Cleaner', p: 8500, pp: 7000, q: 10, ls: 4, ci: 7 },
        { name: 'Car Polish Wax Kit', p: 2500, pp: 1900, q: 40, ls: 15, ci: 7 },
      ];
      // Raw materials
      const rawDefs = [
        { name: 'Steel Sheet Raw (kg)', p: 500, pp: 400, q: 500, ls: 100, ci: 0, raw: true },
        { name: 'Rubber Compound (kg)', p: 300, pp: 220, q: 800, ls: 200, ci: 1, raw: true },
        { name: 'Plastic Pellets (kg)', p: 200, pp: 150, q: 1000, ls: 250, ci: 4, raw: true },
        { name: 'Copper Wire (m)', p: 150, pp: 110, q: 600, ls: 150, ci: 2, raw: true },
        { name: 'Filter Paper Roll (m)', p: 80, pp: 60, q: 1200, ls: 300, ci: 3, raw: true },
        { name: 'Adhesive Sealant (L)', p: 450, pp: 350, q: 200, ls: 50, ci: 0, raw: true },
        { name: 'Glass Sheet (sqft)', p: 600, pp: 480, q: 150, ls: 40, ci: 4, raw: true },
        { name: 'Foam Padding (m)', p: 250, pp: 190, q: 400, ls: 100, ci: 5, raw: true },
      ];

      const products = [];
      const allProdDefs = [...prodDefs, ...rawDefs];
      for (let i = 0; i < allProdDefs.length; i++) {
        const d = allProdDefs[i];
        products.push(await prisma.product.create({
          data: {
            name: d.name, description: `Premium quality ${d.name}`,
            price: d.p, purchasePrice: d.pp, retailPrice: d.p,
            wholesalePrice: Math.floor(d.p * 0.88),
            perUnitPurchasePrice: d.pp,
            sku: `HG${String(i + 1).padStart(5, '0')}`,
            quantity: d.q, lowStockThreshold: d.ls, unit: d.raw ? 'kg' : 'pcs',
            isRawMaterial: !!d.raw, categoryId: categories[d.ci].id, userId,
            createdAt: randomDate(new Date(2024, 0, 1), new Date()),
          }
        }));
      }
      const finished = products.filter(p => !p.isRawMaterial);
      const rawMats = products.filter(p => p.isRawMaterial);

      // ── Contacts (40: 20 customers, 15 suppliers, 5 both) ──
      const custNames = [
        'Ahmad Ali Motors', 'Fatima Auto Works', 'Hassan Car Care', 'Bilal Transport',
        'Kareem Auto Traders', 'Nadia Vehicles', 'Tariq Motor House', 'Sana Car Mart',
        'Imran Auto Parts', 'Zara Motors', 'Kashif Automobiles', 'Ayesha Car Center',
        'Faisal Speed Motors', 'Hina Auto Zone', 'Waqar Motor World',
        'Saad Car Palace', 'Rabia Auto Hub', 'Junaid Motor Plaza', 'Amna Car Kingdom', 'Umar Auto Express'
      ];
      const suppNames = [
        'Toyota Parts Distributor', 'Honda Genuine Parts', 'Suzuki Wholesale', 'Hyundai Parts Co',
        'KIA Motors Supply', 'Denso Components', 'Bosch Auto Parts', 'NGK Spark Plugs Dist',
        'Continental Tires Dist', 'Bridgestone Wholesale', 'Castrol Lubricants', 'Shell Pakistan',
        'Exide Battery Dist', 'Pak Suzuki Parts', 'Atlas Honda Parts'
      ];
      const bothNames = ['Ali & Sons Trading', 'Pak Auto Exchange', 'Metro Motor Parts', 'City Auto Traders', 'National Auto Supply'];
      const contacts = [];
      const allContactDefs = [
        ...custNames.map(n => ({ name: n, type: 'customer' })),
        ...suppNames.map(n => ({ name: n, type: 'supplier' })),
        ...bothNames.map(n => ({ name: n, type: 'both' })),
      ];
      for (let i = 0; i < allContactDefs.length; i++) {
        const d = allContactDefs[i];
        contacts.push(await prisma.contact.create({
          data: {
            name: d.name, phoneNumber: `+9230${String(10000000 + i).slice(1)}`,
            address: `Shop ${i + 1}, Auto Market, ${pick(['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad'])}`,
            contactType: d.type, userId,
            createdAt: randomDate(new Date(2024, 0, 1), new Date()),
          }
        }));
      }
      const customers = contacts.filter(c => c.contactType === 'customer' || c.contactType === 'both');
      const suppliers = contacts.filter(c => c.contactType === 'supplier' || c.contactType === 'both');

      // ── Branches (4) ──
      const branchDefs = ['Main Showroom', 'Service Center', 'Parts Warehouse', 'Online Store'];
      const branches = [];
      const shortId = userId.substring(0, 6);
      for (let i = 0; i < branchDefs.length; i++) {
        branches.push(await prisma.branch.create({
          data: { name: `${branchDefs[i]} [${shortId}]`, code: `BR${shortId}${i + 1}`, location: `Location ${i + 1}, City`, userId }
        }));
      }

      // ── Employees (15) ──
      const empFirstNames = ['Ahmed', 'Ali', 'Hassan', 'Fatima', 'Aisha', 'Omar', 'Zainab', 'Usman', 'Khadija', 'Ibrahim', 'Bilal', 'Sara', 'Hamza', 'Maryam', 'Yusuf'];
      const empLastNames = ['Khan', 'Ahmed', 'Ali', 'Sheikh', 'Malik', 'Hussain', 'Qureshi', 'Siddiqui', 'Chaudhry', 'Butt', 'Rana', 'Mirza', 'Bhatti', 'Aslam', 'Iqbal'];
      const employees = [];
      for (let i = 0; i < 15; i++) {
        employees.push(await prisma.employee.create({
          data: {
            firstName: empFirstNames[i], lastName: empLastNames[i],
            phone: `+9231${String(10000000 + i).slice(1)}`,
            email: `emp${i + 1}.${userId.substring(0, 6)}@hisabghar.local`,
            password: '$2a$10$dummyhashnotusable000000000000000000000000000000',
            permissions: JSON.stringify(['pos', 'inventory', 'sales']),
            branchId: branches[i % branches.length].id, userId,
          }
        }));
      }

      // ── Bulk Purchases (40) ──
      for (let i = 0; i < 40; i++) {
        const purchaseDate = randomDate(new Date(2024, 0, 1), new Date());
        const items = [];
        const itemCount = randomAmount(2, 6);
        let total = 0;
        for (let j = 0; j < itemCount; j++) {
          const prod = pick(products);
          const qty = randomAmount(5, 80);
          const price = Number(prod.purchasePrice) * (0.9 + Math.random() * 0.2);
          items.push({ productId: prod.id, quantity: qty, purchasePrice: Math.round(price) });
          total += qty * Math.round(price);
        }
        const paid = i % 5 === 0 ? randomAmount(Math.floor(total * 0.3), Math.floor(total * 0.8)) : total;
        const purchase = await prisma.bulkPurchase.create({
          data: {
            invoiceNumber: `INV-${shortId}-${String(i + 1).padStart(5, '0')}`,
            totalAmount: total, paidAmount: paid, discount: randomAmount(0, Math.floor(total * 0.05)),
            purchaseDate, description: `Purchase batch ${i + 1}`,
            contactId: pick(suppliers).id, userId, createdAt: purchaseDate,
          }
        });
        for (const item of items) {
          await prisma.bulkPurchaseItem.create({ data: { ...item, bulkPurchaseId: purchase.id } });
        }
      }

      // ── Sales (80) ──
      const salesCreated = [];
      for (let i = 0; i < 80; i++) {
        const saleDate = randomDate(new Date(2024, 0, 1), new Date());
        const items = [];
        const itemCount = randomAmount(1, 5);
        let total = 0;
        for (let j = 0; j < itemCount; j++) {
          const prod = pick(finished);
          const qty = randomAmount(1, 8);
          const price = Number(prod.price);
          items.push({ productId: prod.id, quantity: qty, price, purchasePrice: Number(prod.purchasePrice), priceType: Math.random() > 0.7 ? 'wholesale' : 'retail' });
          total += qty * price;
        }
        const discount = randomAmount(0, Math.floor(total * 0.1));
        const finalTotal = total - discount;
        const paid = i % 6 === 0 ? randomAmount(Math.floor(finalTotal * 0.4), Math.floor(finalTotal * 0.9)) : finalTotal;
        const billNumber = `${shortId}${String(1000000 + i)}`;
        const sale = await prisma.sale.create({
          data: {
            billNumber, totalAmount: finalTotal, originalTotalAmount: total,
            discount, paidAmount: paid, saleDate,
            contactId: i % 3 === 0 ? pick(customers).id : null,
            employeeId: pick(employees).id,
            orderBookerId: i % 4 === 0 ? pick(customers).id : null,
            userId, createdAt: saleDate,
          }
        });
        for (const item of items) {
          await prisma.saleItem.create({ data: { ...item, saleId: sale.id } });
        }
        salesCreated.push(sale);
      }

      // ── Returns (20) ──
      const salesToReturn = salesCreated.slice(0, 20);
      for (let i = 0; i < salesToReturn.length; i++) {
        const sale = salesToReturn[i];
        const saleItems = await prisma.saleItem.findMany({ where: { saleId: sale.id } });
        if (saleItems.length === 0) continue;
        const item = saleItems[0];
        const retQty = randomAmount(1, Math.max(1, Math.floor(Number(item.quantity) / 2)));
        const retTotal = retQty * Number(item.price);
        const isContainer = i % 5 === 0;
        const returnDate = new Date(sale.saleDate.getTime() + randomAmount(1, 7) * 86400000);
        const ret = await prisma.saleReturn.create({
          data: {
            returnNumber: `RET-${shortId}-${String(i + 1).padStart(5, '0')}`,
            totalAmount: isContainer ? 0 : retTotal, returnDate,
            reason: pick(['Defective', 'Wrong item', 'Customer changed mind', 'Damaged in transit', 'Size mismatch']),
            refundAmount: isContainer ? 0 : retTotal,
            refundPaid: i % 2 === 0, refundDate: i % 2 === 0 ? returnDate : null,
            saleId: sale.id, userId, createdAt: returnDate,
          }
        });
        await prisma.saleReturnItem.create({
          data: { quantity: retQty, price: isContainer ? 0 : Number(item.price), saleReturnId: ret.id, productId: item.productId }
        });
      }

      // ── Expenses (50) ──
      const expCats = ['Showroom Rent', 'Electricity Bill', 'Water Bill', 'Internet', 'Marketing', 'Office Supplies', 'Transportation', 'Equipment Maintenance', 'Insurance', 'Staff Salary', 'Cleaning', 'Security'];
      for (let i = 0; i < 50; i++) {
        await prisma.expense.create({
          data: {
            amount: randomAmount(2000, 80000),
            date: randomDate(new Date(2024, 0, 1), new Date()),
            category: pick(expCats),
            description: `Monthly ${pick(expCats).toLowerCase()} payment`,
            paymentMethod: pick(['Cash', 'Bank Transfer', 'JazzCash', 'EasyPaisa']),
            receiptNumber: `RCP-${String(i + 1).padStart(5, '0')}`,
            contactId: i % 6 === 0 ? pick(contacts).id : null,
            userId,
          }
        });
      }

      // ── Loan Transactions (30) ──
      const loanTypes = ['GIVEN', 'TAKEN'];
      const loanDescs = { GIVEN: 'Advance payment to', TAKEN: 'Payment received from' };
      for (let i = 0; i < 30; i++) {
        const type = pick(loanTypes);
        const contact = pick(contacts);
        await prisma.loanTransaction.create({
          data: {
            amount: randomAmount(5000, 200000), type,
            description: `${loanDescs[type]} ${contact.name}`,
            date: randomDate(new Date(2024, 0, 1), new Date()),
            contactId: contact.id, userId,
          }
        });
      }

      // ── Recipes (6) + Manufacturing (12) ──
      const recipeProducts = finished.slice(0, 6);
      for (let i = 0; i < recipeProducts.length; i++) {
        const recipe = await prisma.recipe.create({
          data: { name: `Recipe: ${recipeProducts[i].name}`, description: `Manufacturing recipe`, productId: recipeProducts[i].id, userId }
        });
        const ingCount = randomAmount(2, 4);
        for (let j = 0; j < ingCount; j++) {
          await prisma.recipeItem.create({
            data: { recipeId: recipe.id, rawMaterialId: rawMats[j % rawMats.length].id, quantity: randomAmount(1, 5), unit: 'kg' }
          });
        }
        for (let k = 0; k < 2; k++) {
          await prisma.manufacturing.create({
            data: {
              recipeId: recipe.id, quantityProduced: randomAmount(10, 50),
              manufacturingCost: randomAmount(5000, 30000),
              productionDate: randomDate(new Date(2024, 3, 1), new Date()),
              notes: `Batch ${k + 1}`, userId,
            }
          });
        }
      }

      // ── Shop Settings ──
      const user = await prisma.user.findUnique({ where: { id: userId } });
      await prisma.shopSettings.create({
        data: {
          email: user?.email || 'demo@hisabghar.com', shopName: 'Hisab Ghar Auto Parts',
          shopDescription: 'Your trusted automotive partner since 2020',
          shopDescription2: 'Quality parts • Competitive prices • Expert service',
          userName1: 'Muhammad Ahmed', userPhone1: '+92300-1234567',
          userName2: 'Ali Hassan', userPhone2: '+92301-2345678',
          brand1: 'AutoMart', brand1Registered: true,
          brand2: 'CarHub', brand2Registered: false,
          userId,
        }
      });

      res.json({
        success: true,
        message: 'Demo data loaded successfully!',
        summary: {
          categories: 8, products: products.length, contacts: contacts.length,
          branches: 4, employees: 15, purchases: 40, sales: 80,
          returns: 20, expenses: 50, loanTransactions: 30, recipes: 6, manufacturing: 12,
        }
      });
    } catch (error) {
      console.error('Seed error:', error);
      res.status(500).json({ error: error.message });
    }
  });
}
