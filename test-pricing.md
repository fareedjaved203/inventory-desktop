# Wholesale and Retail Pricing Implementation

## Changes Made

### Database Schema
- Added `retailPrice` and `wholesalePrice` fields to Product model
- Added `priceType` field to SaleItem model (defaults to "retail")
- Created migration file for PostgreSQL

### Frontend Changes
1. **Products.jsx**:
   - Updated form to include separate retail and wholesale price fields
   - Updated table to display both prices
   - Updated validation schema
   - Backward compatibility with existing `price` field

2. **Sales.jsx**:
   - Added price type selector (retail/wholesale) in sales form
   - Updated product dropdown to show both prices (R: retail, W: wholesale)
   - Updated sale items display to show price type used
   - Default to retail pricing

### Backend Changes
1. **Product Routes**:
   - Updated all product endpoints to return new pricing fields
   - Maintained backward compatibility with legacy `price` field

2. **Sales Routes**:
   - Updated to handle `priceType` in sale items
   - Store price type information for each sale item

3. **Schemas**:
   - Updated product schema to include new pricing fields
   - Updated sale item schema to include price type

## How It Works

1. **Product Creation**: Users can now set both retail and wholesale prices
2. **Sales Process**: 
   - By default, retail price is selected
   - Users can switch to wholesale pricing for bulk sales
   - The selected price type is stored with each sale item
3. **Backward Compatibility**: Existing products with only `price` field will show that price as retail price

## Testing Steps

1. Run the migration: `npx prisma migrate deploy`
2. Create a new product with both retail and wholesale prices
3. Create a sale using retail pricing
4. Create a sale using wholesale pricing
5. Verify both price types are stored and displayed correctly

## Migration Command

```bash
cd backend
npx prisma migrate deploy
```