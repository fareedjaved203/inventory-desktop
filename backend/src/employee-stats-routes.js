export function setupEmployeeStatsRoutes(app, prisma) {
  // Get employee stats
  app.get('/api/employee-stats/:employeeId', async (req, res) => {
    try {
      const { employeeId } = req.params;
      const { period = 'today', startDate, endDate } = req.query;
      
      let dateFilter = {};
      const now = new Date();
      
      if (startDate && endDate) {
        dateFilter = {
          saleDate: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        };
      } else {
        switch (period) {
          case 'today':
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            dateFilter = {
              saleDate: {
                gte: today,
                lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
              }
            };
            break;
          case '7days':
            dateFilter = {
              saleDate: {
                gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
              }
            };
            break;
          case '30days':
            dateFilter = {
              saleDate: {
                gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
              }
            };
            break;
          case '365days':
            dateFilter = {
              saleDate: {
                gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
              }
            };
            break;
        }
      }
      
      const sales = await prisma.sale.findMany({
        where: {
          employeeId,
          ...dateFilter
        },
        include: {
          items: {
            include: {
              product: true
            }
          }
        }
      });
      
      const totalSales = sales.length;
      const totalAmount = sales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);
      const totalItems = sales.reduce((sum, sale) => sum + sale.items.reduce((itemSum, item) => itemSum + Number(item.quantity), 0), 0);
      
      res.json({
        totalSales,
        totalAmount,
        totalItems,
        sales
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get branch-wise employee sales for dashboard
  app.get('/api/branch-employee-sales', async (req, res) => {
    try {
      const { period = '30days' } = req.query;
      
      let dateFilter = {};
      const now = new Date();
      
      switch (period) {
        case 'today':
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          dateFilter = {
            saleDate: {
              gte: today,
              lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
            }
          };
          break;
        case '7days':
          dateFilter = {
            saleDate: {
              gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            }
          };
          break;
        case '30days':
          dateFilter = {
            saleDate: {
              gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            }
          };
          break;
      }
      
      const branches = await prisma.branch.findMany({
        include: {
          employees: {
            include: {
              sales: {
                where: dateFilter,
                select: {
                  totalAmount: true
                }
              }
            }
          }
        }
      });
      
      const branchData = branches.map(branch => ({
        branchName: branch.name,
        employees: branch.employees.map(employee => ({
          name: `${employee.firstName} ${employee.lastName}`,
          sales: employee.sales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0)
        }))
      }));
      
      res.json(branchData);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
}