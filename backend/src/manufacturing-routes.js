import { validateRequest, authenticateToken } from './middleware.js';
import { z } from 'zod';
import crypto from 'crypto';
import { withTransaction } from './db-utils.js';

const recipeItemSchema = z.object({
  rawMaterialId: z.string().min(1, "Raw material is required"),
  quantity: z.number().positive("Quantity must be positive"),
  unit: z.string().optional().default("pcs")
});

const recipeSchema = z.object({
  name: z.string().min(1, "Recipe name is required"),
  description: z.string().optional(),
  productId: z.string().min(1, "Product is required"),
  ingredients: z.array(recipeItemSchema).min(1, "At least one ingredient is required")
});

const manufacturingSchema = z.object({
  recipeId: z.string().min(1, "Recipe is required"),
  quantityProduced: z.number().positive("Quantity must be positive"),
  manufacturingCost: z.number().min(0).optional(),
  productionDate: z.string().optional(),
  notes: z.string().optional()
});

export function setupManufacturingRoutes(app, prisma) {
  // Get all recipes
  app.get('/api/recipes', authenticateToken, async (req, res) => {
    try {
      const { page = 1, limit = 10, search = '' } = req.query;

      let where = { userId: req.userId };

      if (search) {
        where.name = {
          contains: search,
          mode: 'insensitive'
        };
      }

      const [total, items] = await Promise.all([
        prisma.recipe.count({ where }),
        prisma.recipe.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            product: true,
            ingredients: {
              include: {
                rawMaterial: true
              }
            }
          }
        })
      ]);

      res.json({
        items,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create recipe
  app.post('/api/recipes', authenticateToken, validateRequest({ body: recipeSchema }), async (req, res) => {
    try {
      const recipe = await withTransaction(prisma, async (prisma) => {
        // Check if product already has a recipe
        const existingRecipe = await prisma.recipe.findUnique({
          where: { productId: req.body.productId }
        });

        if (existingRecipe) {
          throw new Error('Product already has a recipe');
        }

        // Verify all raw materials exist and are marked as raw materials
        const rawMaterials = await prisma.product.findMany({
          where: {
            id: { in: req.body.ingredients.map(i => i.rawMaterialId) },
            userId: req.userId,
            isRawMaterial: true
          }
        });

        if (rawMaterials.length !== req.body.ingredients.length) {
          throw new Error('Some raw materials not found or not marked as raw materials');
        }

        // Create recipe
        const recipe = await prisma.recipe.create({
          data: {
            name: req.body.name,
            description: req.body.description,
            productId: req.body.productId,
            userId: req.userId,
            ingredients: {
              create: req.body.ingredients.map(ingredient => ({
                rawMaterialId: ingredient.rawMaterialId,
                quantity: ingredient.quantity,
                unit: ingredient.unit || 'pcs'
              }))
            }
          },
          include: {
            product: true,
            ingredients: {
              include: {
                rawMaterial: true
              }
            }
          }
        });

        return recipe;
      });

      res.status(201).json(recipe);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Update recipe
  app.put('/api/recipes/:id', authenticateToken, validateRequest({ body: recipeSchema }), async (req, res) => {
    try {
      const recipe = await withTransaction(prisma, async (prisma) => {
        const existingRecipe = await prisma.recipe.findUnique({
          where: { id: req.params.id, userId: req.userId }
        });

        if (!existingRecipe) {
          throw new Error('Recipe not found');
        }

        // Delete existing ingredients
        await prisma.recipeItem.deleteMany({
          where: { recipeId: req.params.id }
        });

        // Update recipe
        const recipe = await prisma.recipe.update({
          where: { id: req.params.id },
          data: {
            name: req.body.name,
            description: req.body.description,
            ingredients: {
              create: req.body.ingredients.map(ingredient => ({
                rawMaterialId: ingredient.rawMaterialId,
                quantity: ingredient.quantity,
                unit: ingredient.unit || 'pcs'
              }))
            }
          },
          include: {
            product: true,
            ingredients: {
              include: {
                rawMaterial: true
              }
            }
          }
        });

        return recipe;
      });

      res.json(recipe);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Delete recipe
  app.delete('/api/recipes/:id', authenticateToken, async (req, res) => {
    try {
      await withTransaction(prisma, async (prisma) => {
        const recipe = await prisma.recipe.findUnique({
          where: { id: req.params.id, userId: req.userId }
        });

        if (!recipe) {
          throw new Error('Recipe not found');
        }

        // Delete ingredients first
        await prisma.recipeItem.deleteMany({
          where: { recipeId: req.params.id }
        });

        // Delete manufacturing records
        await prisma.manufacturing.deleteMany({
          where: { recipeId: req.params.id }
        });

        // Delete recipe
        await prisma.recipe.delete({
          where: { id: req.params.id }
        });
      });

      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get manufacturing records
  app.get('/api/manufacturing', authenticateToken, async (req, res) => {
    try {
      const { page = 1, limit = 10, search = '' } = req.query;

      let where = { userId: req.userId };

      if (search) {
        where.recipe = {
          name: {
            contains: search,
            mode: 'insensitive'
          }
        };
      }

      const [total, items] = await Promise.all([
        prisma.manufacturing.count({ where }),
        prisma.manufacturing.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { productionDate: 'desc' },
          include: {
            recipe: {
              include: {
                product: true,
                ingredients: {
                  include: {
                    rawMaterial: true
                  }
                }
              }
            }
          }
        })
      ]);

      res.json({
        items,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create manufacturing record (produce items)
  app.post('/api/manufacturing', authenticateToken, validateRequest({ body: manufacturingSchema }), async (req, res) => {
    try {
      const manufacturing = await withTransaction(prisma, async (prisma) => {
        const recipe = await prisma.recipe.findUnique({
          where: { id: req.body.recipeId },
          include: {
            product: true,
            ingredients: {
              include: {
                rawMaterial: true
              }
            }
          }
        });

        if (!recipe) {
          throw new Error('Recipe not found');
        }

        // Check if we have enough raw materials with unit conversion
        for (const ingredient of recipe.ingredients) {
          const requiredQuantity = Number(ingredient.quantity) * Number(req.body.quantityProduced);
          const rawMaterial = ingredient.rawMaterial;
          
          // Convert to base units for comparison
          const convertToBaseUnit = (value, unit) => {
            switch (unit) {
              case 'kg': return value * 1000;
              case 'gram': return value;
              case 'ltr': return value * 1000;
              case 'ml': return value;
              default: return value;
            }
          };
          
          const getBaseUnit = (unit) => {
            if (unit === 'kg' || unit === 'gram') return 'gram';
            if (unit === 'ltr' || unit === 'ml') return 'ml';
            return unit;
          };
          
          const availableInBaseUnit = convertToBaseUnit(Number(rawMaterial.quantity), rawMaterial.unit);
          const requiredInBaseUnit = convertToBaseUnit(requiredQuantity, ingredient.unit);
          const availableBaseUnit = getBaseUnit(rawMaterial.unit);
          const requiredBaseUnit = getBaseUnit(ingredient.unit);
          
          if (availableBaseUnit === requiredBaseUnit) {
            if (availableInBaseUnit < requiredInBaseUnit) {
              throw new Error(`Insufficient ${rawMaterial.name}. Required: ${requiredQuantity} ${ingredient.unit}, Available: ${rawMaterial.quantity} ${rawMaterial.unit}`);
            }
          } else {
            // Incompatible units
            throw new Error(`Unit mismatch for ${rawMaterial.name}. Recipe needs ${ingredient.unit}, but stock is in ${rawMaterial.unit}`);
          }
        }

        // Deduct raw materials
        for (const ingredient of recipe.ingredients) {
          const requiredQuantity = Number(ingredient.quantity) * Number(req.body.quantityProduced);
          
          await prisma.product.update({
            where: { id: ingredient.rawMaterialId },
            data: {
              quantity: {
                decrement: requiredQuantity
              }
            }
          });
        }

        // Add produced quantity to final product
        await prisma.product.update({
          where: { id: recipe.productId },
          data: {
            quantity: {
              increment: Number(req.body.quantityProduced)
            }
          }
        });

        // Calculate manufacturing cost if not provided
        let manufacturingCost = req.body.manufacturingCost;
        if (!manufacturingCost) {
          manufacturingCost = recipe.ingredients.reduce((total, ingredient) => {
            const rawMaterial = ingredient.rawMaterial;
            const ingredientAmount = Number(ingredient.quantity) * Number(req.body.quantityProduced);
            const perUnitCost = Number(rawMaterial.perUnitPurchasePrice || 0) / 100;
            const ingredientCost = ingredientAmount * perUnitCost;
            console.log(`Ingredient ${rawMaterial.name}: ${ingredientAmount} units × ${perUnitCost} = ${ingredientCost}`);
            return total + ingredientCost;
          }, 0);
          console.log(`Total calculated manufacturing cost: ${manufacturingCost}`);
        }

        // Create manufacturing record using raw SQL
        const manufacturingId = crypto.randomUUID();
        const productionDate = req.body.productionDate ? new Date(req.body.productionDate) : new Date();
        
        await prisma.$executeRaw`
          INSERT INTO "Manufacturing" (id, "recipeId", "quantityProduced", "manufacturingCost", "productionDate", notes, "userId", "createdAt", "updatedAt")
          VALUES (${manufacturingId}, ${req.body.recipeId}, ${Number(req.body.quantityProduced)}::decimal, ${Number(Math.round(manufacturingCost))}::decimal, ${productionDate}, ${req.body.notes || null}, ${req.userId}, NOW(), NOW())
        `;
        
        const manufacturing = await prisma.manufacturing.findUnique({
          where: { id: manufacturingId },
          include: {
            recipe: {
              include: {
                product: true,
                ingredients: {
                  include: {
                    rawMaterial: true
                  }
                }
              }
            }
          }
        });

        // Update the manufactured product's per unit cost based on manufacturing cost
        if (manufacturingCost > 0) {
          const perUnitManufacturingCost = manufacturingCost / Number(req.body.quantityProduced);
          await prisma.product.update({
            where: { id: recipe.productId },
            data: {
              perUnitPurchasePrice: Math.round(perUnitManufacturingCost * 100) // Convert to cents for BigInt storage
            }
          });
        }



        return manufacturing;
      });

      res.status(201).json(manufacturing);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get manufacturing cost estimation
  app.post('/api/manufacturing/estimate-cost', authenticateToken, async (req, res) => {
    try {
      const { recipeId, quantityProduced } = req.body;
      
      const recipe = await prisma.recipe.findUnique({
        where: { id: recipeId },
        include: {
          ingredients: {
            include: {
              rawMaterial: true
            }
          }
        }
      });

      if (!recipe) {
        return res.status(404).json({ error: 'Recipe not found' });
      }

      const estimatedCost = recipe.ingredients.reduce((total, ingredient) => {
        const rawMaterial = ingredient.rawMaterial;
        const ingredientAmount = Number(ingredient.quantity) * Number(quantityProduced);
        const perUnitCost = Number(rawMaterial.perUnitPurchasePrice || 0) / 100;
        const ingredientCost = ingredientAmount * perUnitCost;
        return total + ingredientCost;
      }, 0);

      const costBreakdown = recipe.ingredients.map(ingredient => {
        const rawMaterial = ingredient.rawMaterial;
        const ingredientAmount = Number(ingredient.quantity) * Number(quantityProduced);
        const perUnitCost = Number(rawMaterial.perUnitPurchasePrice || 0) / 100;
        const ingredientCost = ingredientAmount * perUnitCost;
        
        return {
          materialName: rawMaterial.name,
          quantity: ingredientAmount,
          unit: ingredient.unit,
          perUnitCost: perUnitCost,
          totalCost: ingredientCost
        };
      });

      res.json({
        estimatedCost: Math.round(estimatedCost),
        costPerUnit: Math.round(estimatedCost / Number(quantityProduced) * 100) / 100,
        breakdown: costBreakdown
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete manufacturing record
  app.delete('/api/manufacturing/:id', authenticateToken, async (req, res) => {
    try {
      await withTransaction(prisma, async (prisma) => {
        const manufacturing = await prisma.manufacturing.findUnique({
          where: { id: req.params.id, userId: req.userId },
          include: {
            recipe: {
              include: {
                ingredients: true
              }
            }
          }
        });

        if (!manufacturing) {
          throw new Error('Manufacturing record not found');
        }

        // Reverse the manufacturing process
        // Add back raw materials
        for (const ingredient of manufacturing.recipe.ingredients) {
          const usedQuantity = Number(ingredient.quantity) * Number(manufacturing.quantityProduced);
          
          await prisma.product.update({
            where: { id: ingredient.rawMaterialId },
            data: {
              quantity: {
                increment: usedQuantity
              }
            }
          });
        }

        // Remove produced quantity from final product
        await prisma.product.update({
          where: { id: manufacturing.recipe.productId },
          data: {
            quantity: {
              decrement: Number(manufacturing.quantityProduced)
            }
          }
        });

        // Delete manufacturing record
        await prisma.manufacturing.delete({
          where: { id: req.params.id }
        });
      });

      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
}