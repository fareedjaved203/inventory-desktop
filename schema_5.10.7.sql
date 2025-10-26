-- Drop all tables first (in reverse dependency order)
DROP TABLE IF EXISTS public."SaleReturnItem" CASCADE;
DROP TABLE IF EXISTS public."SaleReturn" CASCADE;
DROP TABLE IF EXISTS public."SaleItem" CASCADE;
DROP TABLE IF EXISTS public."Sale" CASCADE;
DROP TABLE IF EXISTS public."OrderItem" CASCADE;
DROP TABLE IF EXISTS public."Order" CASCADE;
DROP TABLE IF EXISTS public."MenuItem" CASCADE;
DROP TABLE IF EXISTS public."MenuCategory" CASCADE;
DROP TABLE IF EXISTS public."Manufacturing" CASCADE;
DROP TABLE IF EXISTS public."RecipeItem" CASCADE;
DROP TABLE IF EXISTS public."Recipe" CASCADE;
DROP TABLE IF EXISTS public."Product" CASCADE;
DROP TABLE IF EXISTS public."Category" CASCADE;
DROP TABLE IF EXISTS public."LoanTransaction" CASCADE;
DROP TABLE IF EXISTS public."Expense" CASCADE;
DROP TABLE IF EXISTS public."Employee" CASCADE;
DROP TABLE IF EXISTS public."Branch" CASCADE;
DROP TABLE IF EXISTS public."BulkPurchaseItem" CASCADE;
DROP TABLE IF EXISTS public."BulkPurchase" CASCADE;
DROP TABLE IF EXISTS public."Contact" CASCADE;
DROP TABLE IF EXISTS public."Customer" CASCADE;
DROP TABLE IF EXISTS public."Table" CASCADE;
DROP TABLE IF EXISTS public."ShopSettings" CASCADE;
DROP TABLE IF EXISTS public."License" CASCADE;
DROP TABLE IF EXISTS public."DriveSettings" CASCADE;
DROP TABLE IF EXISTS public."User" CASCADE;

-- Create tables in dependency order

-- 1. Independent tables (no foreign keys)
create table public."User" (
  id text not null,
  email text not null,
  password text not null,
  "resetOtp" text null,
  "otpExpiry" timestamp without time zone null,
  "createdAt" timestamp without time zone not null default CURRENT_TIMESTAMP,
  "updatedAt" timestamp without time zone not null,
  "companyName" text null,
  role text null default 'admin'::text,
  "trialEndDate" timestamp without time zone null,
  "assignedTables" text null,
  constraint User_pkey primary key (id)
) TABLESPACE pg_default;

create unique INDEX IF not exists "User_email_key" on public."User" using btree (email) TABLESPACE pg_default;
create index IF not exists "User_email_idx" on public."User" using btree (email) TABLESPACE pg_default;
create index IF not exists "User_role_idx" on public."User" using btree (role) TABLESPACE pg_default;

create table public."DriveSettings" (
  id text not null,
  "serviceAccountKey" text not null,
  "createdAt" timestamp without time zone not null default CURRENT_TIMESTAMP,
  "updatedAt" timestamp without time zone not null,
  constraint DriveSettings_pkey primary key (id)
) TABLESPACE pg_default;

create table public."License" (
  id text not null,
  "userId" text not null,
  "licenseKey" text not null,
  "deviceFingerprint" text not null,
  expiry bigint not null,
  duration text null,
  "activatedAt" timestamp without time zone not null default CURRENT_TIMESTAMP,
  "isTrial" boolean not null default false,
  "createdAt" timestamp without time zone not null default CURRENT_TIMESTAMP,
  "updatedAt" timestamp without time zone not null,
  constraint License_pkey primary key (id)
) TABLESPACE pg_default;

create unique INDEX IF not exists "License_userId_key" on public."License" using btree ("userId") TABLESPACE pg_default;
create index IF not exists "License_userId_idx" on public."License" using btree ("userId") TABLESPACE pg_default;

create table public."ShopSettings" (
  id text not null,
  email text not null,
  "shopName" text not null,
  "shopDescription" text null,
  "shopDescription2" text null,
  "userName1" text not null,
  "userPhone1" text not null,
  "userName2" text null,
  "userPhone2" text null,
  "userName3" text null,
  "userPhone3" text null,
  brand1 text null,
  "brand1Registered" boolean not null default false,
  brand2 text null,
  "brand2Registered" boolean not null default false,
  brand3 text null,
  "brand3Registered" boolean not null default false,
  logo text null,
  "createdAt" timestamp without time zone not null default CURRENT_TIMESTAMP,
  "updatedAt" timestamp without time zone not null,
  "userId" text not null,
  constraint ShopSettings_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists "ShopSettings_userId_idx" on public."ShopSettings" using btree ("userId") TABLESPACE pg_default;

create table public."Table" (
  id text not null,
  "tableNumber" text not null,
  capacity integer not null,
  status text not null default 'AVAILABLE'::text,
  location text null,
  "createdAt" timestamp without time zone not null default CURRENT_TIMESTAMP,
  "updatedAt" timestamp without time zone not null,
  "userId" text not null,
  constraint Table_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists "Table_userId_idx" on public."Table" using btree ("userId") TABLESPACE pg_default;
create index IF not exists "Table_userId_status_idx" on public."Table" using btree ("userId", status) TABLESPACE pg_default;
create unique INDEX IF not exists "Table_userId_tableNumber_key" on public."Table" using btree ("userId", "tableNumber") TABLESPACE pg_default;

create table public."Customer" (
  id text not null,
  name text not null,
  phone text null,
  email text null,
  address text null,
  "loyaltyPoints" integer not null default 0,
  "totalOrders" integer not null default 0,
  "totalSpent" bigint not null default 0,
  "createdAt" timestamp without time zone not null default CURRENT_TIMESTAMP,
  "updatedAt" timestamp without time zone not null,
  "userId" text not null,
  constraint Customer_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists "Customer_userId_idx" on public."Customer" using btree ("userId") TABLESPACE pg_default;
create index IF not exists "Customer_userId_phone_idx" on public."Customer" using btree ("userId", phone) TABLESPACE pg_default;

create table public."Contact" (
  id text not null,
  name text not null,
  address text null,
  "phoneNumber" text not null,
  "createdAt" timestamp without time zone not null default CURRENT_TIMESTAMP,
  "updatedAt" timestamp without time zone not null,
  "userId" text not null,
  "contactType" text not null default 'customer'::text,
  constraint Contact_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists "Contact_userId_contactType_idx" on public."Contact" using btree ("userId", "contactType") TABLESPACE pg_default;
create index IF not exists "Contact_userId_idx" on public."Contact" using btree ("userId") TABLESPACE pg_default;
create index IF not exists "Contact_userId_name_idx" on public."Contact" using btree ("userId", name) TABLESPACE pg_default;
create index IF not exists "Contact_phoneNumber_idx" on public."Contact" using btree ("phoneNumber") TABLESPACE pg_default;

create table public."Branch" (
  id text not null,
  name text not null,
  code text not null,
  location text not null,
  "createdAt" timestamp without time zone not null default CURRENT_TIMESTAMP,
  "updatedAt" timestamp without time zone not null,
  "userId" text not null,
  constraint Branch_pkey primary key (id)
) TABLESPACE pg_default;

create unique INDEX IF not exists "Branch_name_key" on public."Branch" using btree (name) TABLESPACE pg_default;
create unique INDEX IF not exists "Branch_code_key" on public."Branch" using btree (code) TABLESPACE pg_default;
create index IF not exists "Branch_userId_idx" on public."Branch" using btree ("userId") TABLESPACE pg_default;

create table public."Category" (
  id text not null,
  name text not null,
  description text null,
  color text null default '#3B82F6'::text,
  icon text null default '📦'::text,
  "userId" text not null,
  "createdAt" timestamp without time zone not null default CURRENT_TIMESTAMP,
  "updatedAt" timestamp without time zone not null,
  constraint Category_pkey primary key (id)
) TABLESPACE pg_default;

create unique INDEX IF not exists "Category_userId_name_key" on public."Category" using btree ("userId", name) TABLESPACE pg_default;
create index IF not exists "Category_userId_idx" on public."Category" using btree ("userId") TABLESPACE pg_default;
create index IF not exists "Category_userId_name_idx" on public."Category" using btree ("userId", name) TABLESPACE pg_default;

-- 2. Tables with foreign keys to above tables
create table public."Employee" (
  id text not null,
  "firstName" text not null,
  "lastName" text not null,
  phone text not null,
  email text not null,
  password text not null,
  permissions text not null,
  "branchId" text not null,
  "createdAt" timestamp without time zone not null default CURRENT_TIMESTAMP,
  "updatedAt" timestamp without time zone not null,
  "userId" text not null,
  "assignedTables" text null,
  constraint Employee_pkey primary key (id),
  constraint Employee_branchId_fkey foreign KEY ("branchId") references "Branch" (id) on update CASCADE on delete RESTRICT
) TABLESPACE pg_default;

create unique INDEX IF not exists "Employee_email_key" on public."Employee" using btree (email) TABLESPACE pg_default;
create index IF not exists "Employee_userId_idx" on public."Employee" using btree ("userId") TABLESPACE pg_default;
create index IF not exists "Employee_email_idx" on public."Employee" using btree (email) TABLESPACE pg_default;
create index IF not exists "Employee_branchId_idx" on public."Employee" using btree ("branchId") TABLESPACE pg_default;

create table public."Product" (
  id text not null,
  name text not null,
  description text not null,
  price numeric(10, 2) null,
  "purchasePrice" numeric(10, 2) null default 0,
  sku text null,
  quantity numeric not null,
  "damagedQuantity" numeric not null default 0,
  "lowStockThreshold" numeric not null default 10,
  "createdAt" timestamp without time zone not null default CURRENT_TIMESTAMP,
  "updatedAt" timestamp without time zone not null,
  unit text not null default 'pcs'::text,
  "userId" text not null,
  "isRawMaterial" boolean not null default false,
  "retailPrice" numeric(10, 2) null,
  "wholesalePrice" numeric(10, 2) null,
  "unitValue" numeric(65, 30) null,
  category text null,
  "isMenuItem" boolean not null default false,
  "isVegetarian" boolean not null default false,
  "preparationTime" integer null,
  "spiceLevel" text null,
  "perUnitPurchasePrice" numeric(10, 2) null default 0,
  "categoryId" text null,
  "image" text null,
  constraint Product_pkey primary key (id),
  constraint Product_categoryId_fkey foreign KEY ("categoryId") references "Category" (id) on update CASCADE on delete set null
) TABLESPACE pg_default;

create index IF not exists "Product_userId_idx" on public."Product" using btree ("userId") TABLESPACE pg_default;
create index IF not exists "Product_userId_name_idx" on public."Product" using btree ("userId", name) TABLESPACE pg_default;
create index IF not exists "Product_userId_createdAt_idx" on public."Product" using btree ("userId", "createdAt") TABLESPACE pg_default;
create unique INDEX IF not exists "Product_userId_name_key" on public."Product" using btree ("userId", name) TABLESPACE pg_default;
create index IF not exists "Product_userId_quantity_idx" on public."Product" using btree ("userId", quantity) TABLESPACE pg_default;
create index IF not exists "Product_categoryId_idx" on public."Product" using btree ("categoryId") TABLESPACE pg_default;

create table public."BulkPurchase" (
  id text not null,
  "invoiceNumber" text null,
  "totalAmount" bigint not null,
  "paidAmount" bigint not null,
  "purchaseDate" timestamp without time zone not null default CURRENT_TIMESTAMP,
  "contactId" text not null,
  "createdAt" timestamp without time zone not null default CURRENT_TIMESTAMP,
  "updatedAt" timestamp without time zone not null,
  "userId" text not null,
  discount bigint not null default 0,
  "transportCost" numeric null,
  "carNumber" text null,
  "loadingDate" timestamp without time zone null,
  "arrivalDate" timestamp without time zone null,
  constraint BulkPurchase_pkey primary key (id),
  constraint BulkPurchase_contactId_fkey foreign KEY ("contactId") references "Contact" (id) on update CASCADE on delete RESTRICT
) TABLESPACE pg_default;

create unique INDEX IF not exists "BulkPurchase_invoiceNumber_key" on public."BulkPurchase" using btree ("invoiceNumber") TABLESPACE pg_default;
create index IF not exists "BulkPurchase_userId_idx" on public."BulkPurchase" using btree ("userId") TABLESPACE pg_default;
create index IF not exists "BulkPurchase_contactId_idx" on public."BulkPurchase" using btree ("contactId") TABLESPACE pg_default;

create table public."Expense" (
  id text not null,
  amount bigint not null,
  date timestamp without time zone not null default CURRENT_TIMESTAMP,
  category text not null,
  description text null,
  "paymentMethod" text null,
  "receiptNumber" text null,
  "contactId" text null,
  "userId" text not null,
  "createdAt" timestamp without time zone not null default CURRENT_TIMESTAMP,
  "updatedAt" timestamp without time zone not null,
  "productId" text null,
  constraint Expense_pkey primary key (id),
  constraint Expense_contactId_fkey foreign KEY ("contactId") references "Contact" (id) on update CASCADE on delete set null,
  constraint Expense_productId_fkey foreign KEY ("productId") references "Product" (id) on update CASCADE on delete set null
) TABLESPACE pg_default;

create index IF not exists "Expense_productId_idx" on public."Expense" using btree ("productId") TABLESPACE pg_default;
create index IF not exists "Expense_userId_idx" on public."Expense" using btree ("userId") TABLESPACE pg_default;
create index IF not exists "Expense_userId_date_idx" on public."Expense" using btree ("userId", date) TABLESPACE pg_default;
create index IF not exists "Expense_contactId_idx" on public."Expense" using btree ("contactId") TABLESPACE pg_default;

create table public."LoanTransaction" (
  id text not null,
  amount bigint not null,
  type text not null,
  description text null,
  date timestamp without time zone not null default CURRENT_TIMESTAMP,
  "contactId" text not null,
  "createdAt" timestamp without time zone not null default CURRENT_TIMESTAMP,
  "updatedAt" timestamp without time zone not null,
  "userId" text not null,
  constraint LoanTransaction_pkey primary key (id),
  constraint LoanTransaction_contactId_fkey foreign KEY ("contactId") references "Contact" (id) on update CASCADE on delete RESTRICT
) TABLESPACE pg_default;

create index IF not exists "LoanTransaction_userId_idx" on public."LoanTransaction" using btree ("userId") TABLESPACE pg_default;
create index IF not exists "LoanTransaction_contactId_idx" on public."LoanTransaction" using btree ("contactId") TABLESPACE pg_default;

create table public."MenuCategory" (
  id text not null,
  name text not null,
  description text null,
  "displayOrder" integer not null default 0,
  "isActive" boolean not null default true,
  "createdAt" timestamp without time zone not null default CURRENT_TIMESTAMP,
  "updatedAt" timestamp without time zone not null,
  "userId" text not null,
  constraint MenuCategory_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists "MenuCategory_userId_idx" on public."MenuCategory" using btree ("userId") TABLESPACE pg_default;
create index IF not exists "MenuCategory_userId_displayOrder_idx" on public."MenuCategory" using btree ("userId", "displayOrder") TABLESPACE pg_default;
create unique INDEX IF not exists "MenuCategory_userId_name_key" on public."MenuCategory" using btree ("userId", name) TABLESPACE pg_default;

create table public."Recipe" (
  id text not null,
  name text not null,
  description text null,
  "productId" text not null,
  "userId" text not null,
  "createdAt" timestamp without time zone not null default CURRENT_TIMESTAMP,
  "updatedAt" timestamp without time zone not null,
  constraint Recipe_pkey primary key (id),
  constraint Recipe_productId_fkey foreign KEY ("productId") references "Product" (id) on update CASCADE on delete RESTRICT
) TABLESPACE pg_default;

create unique INDEX IF not exists "Recipe_productId_key" on public."Recipe" using btree ("productId") TABLESPACE pg_default;
create index IF not exists "Recipe_userId_idx" on public."Recipe" using btree ("userId") TABLESPACE pg_default;
create index IF not exists "Recipe_userId_name_idx" on public."Recipe" using btree ("userId", name) TABLESPACE pg_default;

create table public."Order" (
  id text not null,
  "orderNumber" text not null,
  "tableId" text null,
  "customerId" text null,
  "orderType" text not null default 'DINE_IN'::text,
  status text not null default 'PENDING'::text,
  "totalAmount" bigint not null,
  "discountAmount" bigint not null default 0,
  "taxAmount" bigint not null default 0,
  "finalAmount" bigint not null,
  "paymentStatus" text not null default 'PENDING'::text,
  "paymentMethod" text null,
  notes text null,
  "waiterName" text null,
  "createdAt" timestamp without time zone not null default CURRENT_TIMESTAMP,
  "updatedAt" timestamp without time zone not null,
  "completedAt" timestamp without time zone null,
  "userId" text not null,
  constraint Order_pkey primary key (id),
  constraint Order_customerId_fkey foreign KEY ("customerId") references "Customer" (id) on update CASCADE on delete set null,
  constraint Order_tableId_fkey foreign KEY ("tableId") references "Table" (id) on update CASCADE on delete set null
) TABLESPACE pg_default;

create unique INDEX IF not exists "Order_orderNumber_key" on public."Order" using btree ("orderNumber") TABLESPACE pg_default;
create index IF not exists "Order_userId_idx" on public."Order" using btree ("userId") TABLESPACE pg_default;
create index IF not exists "Order_userId_status_idx" on public."Order" using btree ("userId", status) TABLESPACE pg_default;
create index IF not exists "Order_tableId_idx" on public."Order" using btree ("tableId") TABLESPACE pg_default;
create index IF not exists "Order_customerId_idx" on public."Order" using btree ("customerId") TABLESPACE pg_default;
create index IF not exists "Order_userId_createdAt_idx" on public."Order" using btree ("userId", "createdAt") TABLESPACE pg_default;

create table public."Sale" (
  id text not null,
  "billNumber" text not null,
  "totalAmount" bigint not null,
  "originalTotalAmount" bigint null,
  discount numeric not null default 0,
  "paidAmount" bigint not null default 0,
  "saleDate" timestamp without time zone not null default CURRENT_TIMESTAMP,
  "contactId" text null,
  "employeeId" text null,
  "createdAt" timestamp without time zone not null default CURRENT_TIMESTAMP,
  "updatedAt" timestamp without time zone not null,
  "userId" text not null,
  "orderId" text null,
  "orderType" text not null default 'RETAIL'::text,
  "tableId" text null,
  "waiterName" text null,
  "loadingDate" timestamp without time zone null,
  "arrivalDate" timestamp without time zone null,
  description text null,
  "transportCost" numeric null,
  "carNumber" text null,
  constraint Sale_pkey primary key (id),
  constraint Sale_contactId_fkey foreign KEY ("contactId") references "Contact" (id) on update CASCADE on delete set null,
  constraint Sale_employeeId_fkey foreign KEY ("employeeId") references "Employee" (id) on update CASCADE on delete set null,
  constraint Sale_orderId_fkey foreign KEY ("orderId") references "Order" (id) on update CASCADE on delete set null,
  constraint Sale_tableId_fkey foreign KEY ("tableId") references "Table" (id) on update CASCADE on delete set null
) TABLESPACE pg_default;

create index IF not exists "Sale_orderId_idx" on public."Sale" using btree ("orderId") TABLESPACE pg_default;
create index IF not exists "Sale_tableId_idx" on public."Sale" using btree ("tableId") TABLESPACE pg_default;
create unique INDEX IF not exists "Sale_billNumber_key" on public."Sale" using btree ("billNumber") TABLESPACE pg_default;
create index IF not exists "Sale_userId_idx" on public."Sale" using btree ("userId") TABLESPACE pg_default;
create index IF not exists "Sale_userId_saleDate_idx" on public."Sale" using btree ("userId", "saleDate") TABLESPACE pg_default;
create index IF not exists "Sale_userId_createdAt_idx" on public."Sale" using btree ("userId", "createdAt") TABLESPACE pg_default;
create index IF not exists "Sale_contactId_idx" on public."Sale" using btree ("contactId") TABLESPACE pg_default;
create index IF not exists "Sale_employeeId_idx" on public."Sale" using btree ("employeeId") TABLESPACE pg_default;

-- 3. Tables with foreign keys to tables created above
create table public."BulkPurchaseItem" (
  id text not null,
  quantity numeric not null,
  "purchasePrice" numeric(10, 2) not null,
  "bulkPurchaseId" text not null,
  "productId" text not null,
  "createdAt" timestamp without time zone not null default CURRENT_TIMESTAMP,
  "updatedAt" timestamp without time zone not null,
  "isTotalCostItem" boolean not null default false,
  constraint BulkPurchaseItem_pkey primary key (id),
  constraint BulkPurchaseItem_bulkPurchaseId_fkey foreign KEY ("bulkPurchaseId") references "BulkPurchase" (id) on update CASCADE on delete RESTRICT,
  constraint BulkPurchaseItem_productId_fkey foreign KEY ("productId") references "Product" (id) on update CASCADE on delete RESTRICT
) TABLESPACE pg_default;

create index IF not exists "BulkPurchaseItem_bulkPurchaseId_idx" on public."BulkPurchaseItem" using btree ("bulkPurchaseId") TABLESPACE pg_default;
create index IF not exists "BulkPurchaseItem_productId_idx" on public."BulkPurchaseItem" using btree ("productId") TABLESPACE pg_default;

create table public."MenuItem" (
  id text not null,
  "productId" text not null,
  "categoryId" text not null,
  "preparationTime" integer null,
  "isAvailable" boolean not null default true,
  ingredients text null,
  allergens text null,
  "spiceLevel" text null,
  "isVegetarian" boolean not null default false,
  calories integer null,
  "createdAt" timestamp without time zone not null default CURRENT_TIMESTAMP,
  "updatedAt" timestamp without time zone not null,
  "userId" text not null,
  constraint MenuItem_pkey primary key (id),
  constraint MenuItem_categoryId_fkey foreign KEY ("categoryId") references "MenuCategory" (id) on update CASCADE on delete RESTRICT,
  constraint MenuItem_productId_fkey foreign KEY ("productId") references "Product" (id) on update CASCADE on delete RESTRICT
) TABLESPACE pg_default;

create index IF not exists "MenuItem_userId_idx" on public."MenuItem" using btree ("userId") TABLESPACE pg_default;
create index IF not exists "MenuItem_categoryId_idx" on public."MenuItem" using btree ("categoryId") TABLESPACE pg_default;
create index IF not exists "MenuItem_productId_idx" on public."MenuItem" using btree ("productId") TABLESPACE pg_default;
create unique INDEX IF not exists "MenuItem_userId_productId_key" on public."MenuItem" using btree ("userId", "productId") TABLESPACE pg_default;

create table public."Manufacturing" (
  id text not null,
  "recipeId" text not null,
  "quantityProduced" numeric not null,
  "manufacturingCost" bigint null default 0,
  "productionDate" timestamp without time zone not null default CURRENT_TIMESTAMP,
  notes text null,
  "userId" text not null,
  "createdAt" timestamp without time zone not null default CURRENT_TIMESTAMP,
  "updatedAt" timestamp without time zone not null,
  constraint Manufacturing_pkey primary key (id),
  constraint Manufacturing_recipeId_fkey foreign KEY ("recipeId") references "Recipe" (id) on update CASCADE on delete RESTRICT
) TABLESPACE pg_default;

create index IF not exists "Manufacturing_userId_idx" on public."Manufacturing" using btree ("userId") TABLESPACE pg_default;
create index IF not exists "Manufacturing_recipeId_idx" on public."Manufacturing" using btree ("recipeId") TABLESPACE pg_default;
create index IF not exists "Manufacturing_userId_productionDate_idx" on public."Manufacturing" using btree ("userId", "productionDate") TABLESPACE pg_default;

create table public."RecipeItem" (
  id text not null,
  "recipeId" text not null,
  "rawMaterialId" text not null,
  quantity numeric not null,
  unit text not null default 'pcs'::text,
  "createdAt" timestamp without time zone not null default CURRENT_TIMESTAMP,
  "updatedAt" timestamp without time zone not null,
  constraint RecipeItem_pkey primary key (id),
  constraint RecipeItem_rawMaterialId_fkey foreign KEY ("rawMaterialId") references "Product" (id) on update CASCADE on delete RESTRICT,
  constraint RecipeItem_recipeId_fkey foreign KEY ("recipeId") references "Recipe" (id) on update CASCADE on delete RESTRICT
) TABLESPACE pg_default;

create index IF not exists "RecipeItem_recipeId_idx" on public."RecipeItem" using btree ("recipeId") TABLESPACE pg_default;
create index IF not exists "RecipeItem_rawMaterialId_idx" on public."RecipeItem" using btree ("rawMaterialId") TABLESPACE pg_default;

create table public."OrderItem" (
  id text not null,
  "orderId" text not null,
  "productId" text not null,
  quantity integer not null,
  "unitPrice" bigint not null,
  "totalPrice" bigint not null,
  "specialInstructions" text null,
  status text not null default 'ORDERED'::text,
  "createdAt" timestamp without time zone not null default CURRENT_TIMESTAMP,
  "updatedAt" timestamp without time zone not null,
  constraint OrderItem_pkey primary key (id),
  constraint OrderItem_orderId_fkey foreign KEY ("orderId") references "Order" (id) on update CASCADE on delete RESTRICT,
  constraint OrderItem_productId_fkey foreign KEY ("productId") references "Product" (id) on update CASCADE on delete RESTRICT
) TABLESPACE pg_default;

create index IF not exists "OrderItem_orderId_idx" on public."OrderItem" using btree ("orderId") TABLESPACE pg_default;
create index IF not exists "OrderItem_productId_idx" on public."OrderItem" using btree ("productId") TABLESPACE pg_default;
create index IF not exists "OrderItem_status_idx" on public."OrderItem" using btree (status) TABLESPACE pg_default;

create table public."SaleItem" (
  id text not null,
  quantity numeric not null,
  price numeric(10, 2) not null,
  "purchasePrice" numeric(10, 2) not null default 0,
  "saleId" text not null,
  "productId" text not null,
  "createdAt" timestamp without time zone not null default CURRENT_TIMESTAMP,
  "updatedAt" timestamp without time zone not null,
  "priceType" text not null default 'retail'::text,
  constraint SaleItem_pkey primary key (id),
  constraint SaleItem_productId_fkey foreign KEY ("productId") references "Product" (id) on update CASCADE on delete RESTRICT,
  constraint SaleItem_saleId_fkey foreign KEY ("saleId") references "Sale" (id) on update CASCADE on delete RESTRICT
) TABLESPACE pg_default;

create index IF not exists "SaleItem_saleId_idx" on public."SaleItem" using btree ("saleId") TABLESPACE pg_default;
create index IF not exists "SaleItem_productId_idx" on public."SaleItem" using btree ("productId") TABLESPACE pg_default;

create table public."SaleReturn" (
  id text not null,
  "returnNumber" text not null,
  "totalAmount" bigint not null,
  "returnDate" timestamp without time zone not null default CURRENT_TIMESTAMP,
  reason text null,
  "refundAmount" bigint not null default 0,
  "refundPaid" boolean not null default false,
  "refundDate" timestamp without time zone null,
  "saleId" text not null,
  "createdAt" timestamp without time zone not null default CURRENT_TIMESTAMP,
  "updatedAt" timestamp without time zone not null,
  "userId" text not null,
  constraint SaleReturn_pkey primary key (id),
  constraint SaleReturn_saleId_fkey foreign KEY ("saleId") references "Sale" (id) on update CASCADE on delete RESTRICT
) TABLESPACE pg_default;

create unique INDEX IF not exists "SaleReturn_returnNumber_key" on public."SaleReturn" using btree ("returnNumber") TABLESPACE pg_default;
create index IF not exists "SaleReturn_userId_idx" on public."SaleReturn" using btree ("userId") TABLESPACE pg_default;
create index IF not exists "SaleReturn_saleId_idx" on public."SaleReturn" using btree ("saleId") TABLESPACE pg_default;

create table public."SaleReturnItem" (
  id text not null,
  quantity numeric not null,
  price bigint not null,
  "saleReturnId" text not null,
  "productId" text not null,
  "createdAt" timestamp without time zone not null default CURRENT_TIMESTAMP,
  "updatedAt" timestamp without time zone not null,
  constraint SaleReturnItem_pkey primary key (id),
  constraint SaleReturnItem_productId_fkey foreign KEY ("productId") references "Product" (id) on update CASCADE on delete RESTRICT,
  constraint SaleReturnItem_saleReturnId_fkey foreign KEY ("saleReturnId") references "SaleReturn" (id) on update CASCADE on delete RESTRICT
) TABLESPACE pg_default;

create index IF not exists "SaleReturnItem_saleReturnId_idx" on public."SaleReturnItem" using btree ("saleReturnId") TABLESPACE pg_default;
create index IF not exists "SaleReturnItem_productId_idx" on public."SaleReturnItem" using btree ("productId") TABLESPACE pg_default;

-- CreateTable
CREATE TABLE "AuditTrail" (
    "id" TEXT NOT NULL,
    "tableName" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "description" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changedBy" TEXT NOT NULL DEFAULT 'system',
    "saleId" TEXT,
    "purchaseId" TEXT,

    CONSTRAINT "AuditTrail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditTrail_tableName_recordId_idx" ON "AuditTrail"("tableName", "recordId");

-- CreateIndex
CREATE INDEX "AuditTrail_changedAt_idx" ON "AuditTrail"("changedAt");

-- CreateIndex
CREATE INDEX "AuditTrail_saleId_idx" ON "AuditTrail"("saleId");

-- CreateIndex
CREATE INDEX "AuditTrail_purchaseId_idx" ON "AuditTrail"("purchaseId");

-- AddForeignKey
ALTER TABLE "AuditTrail" ADD CONSTRAINT "AuditTrail_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditTrail" ADD CONSTRAINT "AuditTrail_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "BulkPurchase"("id") ON DELETE CASCADE ON UPDATE CASCADE;