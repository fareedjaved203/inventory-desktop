--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5
-- Dumped by pg_dump version 17.5

-- Started on 2025-11-02 02:28:09

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 243 (class 1259 OID 123263)
-- Name: AuditTrail; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."AuditTrail" (
    id text NOT NULL,
    "tableName" text NOT NULL,
    "recordId" text NOT NULL,
    "fieldName" text NOT NULL,
    "oldValue" text,
    "newValue" text,
    "changedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "changedBy" text DEFAULT 'system'::text NOT NULL,
    "saleId" text,
    "purchaseId" text,
    description text
);


ALTER TABLE public."AuditTrail" OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 91798)
-- Name: Branch; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Branch" (
    id text NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    location text NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp without time zone NOT NULL,
    "userId" text NOT NULL
);


ALTER TABLE public."Branch" OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 91866)
-- Name: BulkPurchase; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."BulkPurchase" (
    id text NOT NULL,
    "invoiceNumber" text,
    "totalAmount" bigint NOT NULL,
    "paidAmount" bigint NOT NULL,
    "purchaseDate" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "contactId" text NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp without time zone NOT NULL,
    "userId" text NOT NULL,
    discount bigint DEFAULT 0 NOT NULL,
    "transportCost" numeric,
    "carNumber" text,
    "loadingDate" timestamp without time zone,
    "arrivalDate" timestamp without time zone,
    description text
);


ALTER TABLE public."BulkPurchase" OWNER TO postgres;

--
-- TOC entry 235 (class 1259 OID 92021)
-- Name: BulkPurchaseItem; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."BulkPurchaseItem" (
    id text NOT NULL,
    quantity numeric NOT NULL,
    "purchasePrice" numeric(10,2) NOT NULL,
    "bulkPurchaseId" text NOT NULL,
    "productId" text NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp without time zone NOT NULL,
    "isTotalCostItem" boolean DEFAULT false NOT NULL
);


ALTER TABLE public."BulkPurchaseItem" OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 91809)
-- Name: Category; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Category" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    color text DEFAULT '#3B82F6'::text,
    icon text DEFAULT '📦'::text,
    "userId" text NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp without time zone NOT NULL
);


ALTER TABLE public."Category" OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 91785)
-- Name: Contact; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Contact" (
    id text NOT NULL,
    name text NOT NULL,
    address text,
    "phoneNumber" text NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp without time zone NOT NULL,
    "userId" text NOT NULL,
    "contactType" text DEFAULT 'customer'::text NOT NULL
);


ALTER TABLE public."Contact" OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 91772)
-- Name: Customer; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Customer" (
    id text NOT NULL,
    name text NOT NULL,
    phone text,
    email text,
    address text,
    "loyaltyPoints" integer DEFAULT 0 NOT NULL,
    "totalOrders" integer DEFAULT 0 NOT NULL,
    "totalSpent" bigint DEFAULT 0 NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp without time zone NOT NULL,
    "userId" text NOT NULL
);


ALTER TABLE public."Customer" OWNER TO postgres;

--
-- TOC entry 218 (class 1259 OID 91728)
-- Name: DriveSettings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."DriveSettings" (
    id text NOT NULL,
    "serviceAccountKey" text NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp without time zone NOT NULL
);


ALTER TABLE public."DriveSettings" OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 91822)
-- Name: Employee; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Employee" (
    id text NOT NULL,
    "firstName" text NOT NULL,
    "lastName" text NOT NULL,
    phone text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    permissions text NOT NULL,
    "branchId" text NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp without time zone NOT NULL,
    "userId" text NOT NULL,
    "assignedTables" text
);


ALTER TABLE public."Employee" OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 91884)
-- Name: Expense; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Expense" (
    id text NOT NULL,
    amount bigint NOT NULL,
    date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    category text NOT NULL,
    description text,
    "paymentMethod" text,
    "receiptNumber" text,
    "contactId" text,
    "userId" text NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp without time zone NOT NULL,
    "productId" text
);


ALTER TABLE public."Expense" OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 91736)
-- Name: License; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."License" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "licenseKey" text NOT NULL,
    "deviceFingerprint" text NOT NULL,
    expiry bigint NOT NULL,
    duration text,
    "activatedAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "isTrial" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp without time zone NOT NULL
);


ALTER TABLE public."License" OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 91907)
-- Name: LoanTransaction; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."LoanTransaction" (
    id text NOT NULL,
    amount bigint NOT NULL,
    type text NOT NULL,
    description text,
    date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "contactId" text NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp without time zone NOT NULL,
    "userId" text NOT NULL
);


ALTER TABLE public."LoanTransaction" OWNER TO postgres;

--
-- TOC entry 237 (class 1259 OID 92066)
-- Name: Manufacturing; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Manufacturing" (
    id text NOT NULL,
    "recipeId" text NOT NULL,
    "quantityProduced" numeric NOT NULL,
    "manufacturingCost" bigint DEFAULT 0,
    "productionDate" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    notes text,
    "userId" text NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp without time zone NOT NULL
);


ALTER TABLE public."Manufacturing" OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 91923)
-- Name: MenuCategory; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."MenuCategory" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "displayOrder" integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp without time zone NOT NULL,
    "userId" text NOT NULL
);


ALTER TABLE public."MenuCategory" OWNER TO postgres;

--
-- TOC entry 236 (class 1259 OID 92042)
-- Name: MenuItem; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."MenuItem" (
    id text NOT NULL,
    "productId" text NOT NULL,
    "categoryId" text NOT NULL,
    "preparationTime" integer,
    "isAvailable" boolean DEFAULT true NOT NULL,
    ingredients text,
    allergens text,
    "spiceLevel" text,
    "isVegetarian" boolean DEFAULT false NOT NULL,
    calories integer,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp without time zone NOT NULL,
    "userId" text NOT NULL
);


ALTER TABLE public."MenuItem" OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 91952)
-- Name: Order; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Order" (
    id text NOT NULL,
    "orderNumber" text NOT NULL,
    "tableId" text,
    "customerId" text,
    "orderType" text DEFAULT 'DINE_IN'::text NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    "totalAmount" bigint NOT NULL,
    "discountAmount" bigint DEFAULT 0 NOT NULL,
    "taxAmount" bigint DEFAULT 0 NOT NULL,
    "finalAmount" bigint NOT NULL,
    "paymentStatus" text DEFAULT 'PENDING'::text NOT NULL,
    "paymentMethod" text,
    notes text,
    "waiterName" text,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp without time zone NOT NULL,
    "completedAt" timestamp without time zone,
    "userId" text NOT NULL
);


ALTER TABLE public."Order" OWNER TO postgres;

--
-- TOC entry 239 (class 1259 OID 92105)
-- Name: OrderItem; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."OrderItem" (
    id text NOT NULL,
    "orderId" text NOT NULL,
    "productId" text NOT NULL,
    quantity integer NOT NULL,
    "unitPrice" bigint NOT NULL,
    "totalPrice" bigint NOT NULL,
    "specialInstructions" text,
    status text DEFAULT 'ORDERED'::text NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp without time zone NOT NULL
);


ALTER TABLE public."OrderItem" OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 91839)
-- Name: Product; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Product" (
    id text NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    price numeric(10,2),
    "purchasePrice" numeric(10,2) DEFAULT 0,
    sku text,
    quantity numeric NOT NULL,
    "damagedQuantity" numeric DEFAULT 0 NOT NULL,
    "lowStockThreshold" numeric DEFAULT 10 NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp without time zone NOT NULL,
    unit text DEFAULT 'pcs'::text NOT NULL,
    "userId" text NOT NULL,
    "isRawMaterial" boolean DEFAULT false NOT NULL,
    "retailPrice" numeric(10,2),
    "wholesalePrice" numeric(10,2),
    "unitValue" numeric(65,30),
    category text,
    "isMenuItem" boolean DEFAULT false NOT NULL,
    "isVegetarian" boolean DEFAULT false NOT NULL,
    "preparationTime" integer,
    "spiceLevel" text,
    "perUnitPurchasePrice" numeric(10,2) DEFAULT 0,
    "categoryId" text,
    image text
);


ALTER TABLE public."Product" OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 91936)
-- Name: Recipe; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Recipe" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "productId" text NOT NULL,
    "userId" text NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp without time zone NOT NULL
);


ALTER TABLE public."Recipe" OWNER TO postgres;

--
-- TOC entry 238 (class 1259 OID 92084)
-- Name: RecipeItem; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."RecipeItem" (
    id text NOT NULL,
    "recipeId" text NOT NULL,
    "rawMaterialId" text NOT NULL,
    quantity numeric NOT NULL,
    unit text DEFAULT 'pcs'::text NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp without time zone NOT NULL
);


ALTER TABLE public."RecipeItem" OWNER TO postgres;

--
-- TOC entry 234 (class 1259 OID 91981)
-- Name: Sale; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Sale" (
    id text NOT NULL,
    "billNumber" text NOT NULL,
    "totalAmount" bigint NOT NULL,
    "originalTotalAmount" bigint,
    discount numeric DEFAULT 0 NOT NULL,
    "paidAmount" bigint DEFAULT 0 NOT NULL,
    "saleDate" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "contactId" text,
    "employeeId" text,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp without time zone NOT NULL,
    "userId" text NOT NULL,
    "orderId" text,
    "orderType" text DEFAULT 'RETAIL'::text NOT NULL,
    "tableId" text,
    "waiterName" text,
    "loadingDate" timestamp without time zone,
    "arrivalDate" timestamp without time zone,
    description text,
    "transportCost" numeric,
    "carNumber" text
);


ALTER TABLE public."Sale" OWNER TO postgres;

--
-- TOC entry 240 (class 1259 OID 92127)
-- Name: SaleItem; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SaleItem" (
    id text NOT NULL,
    quantity numeric NOT NULL,
    price numeric(10,2) NOT NULL,
    "purchasePrice" numeric(10,2) DEFAULT 0 NOT NULL,
    "saleId" text NOT NULL,
    "productId" text NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp without time zone NOT NULL,
    "priceType" text DEFAULT 'retail'::text NOT NULL
);


ALTER TABLE public."SaleItem" OWNER TO postgres;

--
-- TOC entry 241 (class 1259 OID 92149)
-- Name: SaleReturn; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SaleReturn" (
    id text NOT NULL,
    "returnNumber" text NOT NULL,
    "totalAmount" bigint NOT NULL,
    "returnDate" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    reason text,
    "refundAmount" bigint DEFAULT 0 NOT NULL,
    "refundPaid" boolean DEFAULT false NOT NULL,
    "refundDate" timestamp without time zone,
    "saleId" text NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp without time zone NOT NULL,
    "userId" text NOT NULL
);


ALTER TABLE public."SaleReturn" OWNER TO postgres;

--
-- TOC entry 242 (class 1259 OID 92168)
-- Name: SaleReturnItem; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SaleReturnItem" (
    id text NOT NULL,
    quantity numeric NOT NULL,
    price bigint NOT NULL,
    "saleReturnId" text NOT NULL,
    "productId" text NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp without time zone NOT NULL
);


ALTER TABLE public."SaleReturnItem" OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 91748)
-- Name: ShopSettings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ShopSettings" (
    id text NOT NULL,
    email text NOT NULL,
    "shopName" text NOT NULL,
    "shopDescription" text,
    "shopDescription2" text,
    "userName1" text NOT NULL,
    "userPhone1" text NOT NULL,
    "userName2" text,
    "userPhone2" text,
    "userName3" text,
    "userPhone3" text,
    brand1 text,
    "brand1Registered" boolean DEFAULT false NOT NULL,
    brand2 text,
    "brand2Registered" boolean DEFAULT false NOT NULL,
    brand3 text,
    "brand3Registered" boolean DEFAULT false NOT NULL,
    logo text,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp without time zone NOT NULL,
    "userId" text NOT NULL
);


ALTER TABLE public."ShopSettings" OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 91760)
-- Name: Table; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Table" (
    id text NOT NULL,
    "tableNumber" text NOT NULL,
    capacity integer NOT NULL,
    status text DEFAULT 'AVAILABLE'::text NOT NULL,
    location text,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp without time zone NOT NULL,
    "userId" text NOT NULL
);


ALTER TABLE public."Table" OWNER TO postgres;

--
-- TOC entry 217 (class 1259 OID 91716)
-- Name: User; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."User" (
    id text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    "resetOtp" text,
    "otpExpiry" timestamp without time zone,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp without time zone NOT NULL,
    "companyName" text,
    role text DEFAULT 'admin'::text,
    "trialEndDate" timestamp without time zone,
    "assignedTables" text
);


ALTER TABLE public."User" OWNER TO postgres;

--
-- TOC entry 5009 (class 2606 OID 123271)
-- Name: AuditTrail AuditTrail_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AuditTrail"
    ADD CONSTRAINT "AuditTrail_pkey" PRIMARY KEY (id);


--
-- TOC entry 4907 (class 2606 OID 91805)
-- Name: Branch branch_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Branch"
    ADD CONSTRAINT branch_pkey PRIMARY KEY (id);


--
-- TOC entry 4931 (class 2606 OID 91875)
-- Name: BulkPurchase bulkpurchase_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BulkPurchase"
    ADD CONSTRAINT bulkpurchase_pkey PRIMARY KEY (id);


--
-- TOC entry 4973 (class 2606 OID 92029)
-- Name: BulkPurchaseItem bulkpurchaseitem_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BulkPurchaseItem"
    ADD CONSTRAINT bulkpurchaseitem_pkey PRIMARY KEY (id);


--
-- TOC entry 4912 (class 2606 OID 91818)
-- Name: Category category_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Category"
    ADD CONSTRAINT category_pkey PRIMARY KEY (id);


--
-- TOC entry 4902 (class 2606 OID 91793)
-- Name: Contact contact_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Contact"
    ADD CONSTRAINT contact_pkey PRIMARY KEY (id);


--
-- TOC entry 4896 (class 2606 OID 91782)
-- Name: Customer customer_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customer"
    ADD CONSTRAINT customer_pkey PRIMARY KEY (id);


--
-- TOC entry 4880 (class 2606 OID 91735)
-- Name: DriveSettings drivesettings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DriveSettings"
    ADD CONSTRAINT drivesettings_pkey PRIMARY KEY (id);


--
-- TOC entry 4918 (class 2606 OID 91829)
-- Name: Employee employee_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Employee"
    ADD CONSTRAINT employee_pkey PRIMARY KEY (id);


--
-- TOC entry 4937 (class 2606 OID 91892)
-- Name: Expense expense_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Expense"
    ADD CONSTRAINT expense_pkey PRIMARY KEY (id);


--
-- TOC entry 4884 (class 2606 OID 91745)
-- Name: License license_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."License"
    ADD CONSTRAINT license_pkey PRIMARY KEY (id);


--
-- TOC entry 4941 (class 2606 OID 91915)
-- Name: LoanTransaction loantransaction_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."LoanTransaction"
    ADD CONSTRAINT loantransaction_pkey PRIMARY KEY (id);


--
-- TOC entry 4984 (class 2606 OID 92075)
-- Name: Manufacturing manufacturing_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Manufacturing"
    ADD CONSTRAINT manufacturing_pkey PRIMARY KEY (id);


--
-- TOC entry 4946 (class 2606 OID 91932)
-- Name: MenuCategory menucategory_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MenuCategory"
    ADD CONSTRAINT menucategory_pkey PRIMARY KEY (id);


--
-- TOC entry 4979 (class 2606 OID 92051)
-- Name: MenuItem menuitem_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MenuItem"
    ADD CONSTRAINT menuitem_pkey PRIMARY KEY (id);


--
-- TOC entry 4959 (class 2606 OID 91964)
-- Name: Order order_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT order_pkey PRIMARY KEY (id);


--
-- TOC entry 4993 (class 2606 OID 92113)
-- Name: OrderItem orderitem_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT orderitem_pkey PRIMARY KEY (id);


--
-- TOC entry 4926 (class 2606 OID 91854)
-- Name: Product product_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT product_pkey PRIMARY KEY (id);


--
-- TOC entry 4951 (class 2606 OID 91943)
-- Name: Recipe recipe_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Recipe"
    ADD CONSTRAINT recipe_pkey PRIMARY KEY (id);


--
-- TOC entry 4988 (class 2606 OID 92092)
-- Name: RecipeItem recipeitem_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RecipeItem"
    ADD CONSTRAINT recipeitem_pkey PRIMARY KEY (id);


--
-- TOC entry 4969 (class 2606 OID 91992)
-- Name: Sale sale_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Sale"
    ADD CONSTRAINT sale_pkey PRIMARY KEY (id);


--
-- TOC entry 4997 (class 2606 OID 92136)
-- Name: SaleItem saleitem_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SaleItem"
    ADD CONSTRAINT saleitem_pkey PRIMARY KEY (id);


--
-- TOC entry 5002 (class 2606 OID 92159)
-- Name: SaleReturn salereturn_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SaleReturn"
    ADD CONSTRAINT salereturn_pkey PRIMARY KEY (id);


--
-- TOC entry 5006 (class 2606 OID 92175)
-- Name: SaleReturnItem salereturnitem_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SaleReturnItem"
    ADD CONSTRAINT salereturnitem_pkey PRIMARY KEY (id);


--
-- TOC entry 4887 (class 2606 OID 91758)
-- Name: ShopSettings shopsettings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ShopSettings"
    ADD CONSTRAINT shopsettings_pkey PRIMARY KEY (id);


--
-- TOC entry 4892 (class 2606 OID 91768)
-- Name: Table table_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Table"
    ADD CONSTRAINT table_pkey PRIMARY KEY (id);


--
-- TOC entry 4878 (class 2606 OID 91724)
-- Name: User user_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);


--
-- TOC entry 5007 (class 1259 OID 123273)
-- Name: AuditTrail_changedAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AuditTrail_changedAt_idx" ON public."AuditTrail" USING btree ("changedAt");


--
-- TOC entry 5010 (class 1259 OID 123275)
-- Name: AuditTrail_purchaseId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AuditTrail_purchaseId_idx" ON public."AuditTrail" USING btree ("purchaseId");


--
-- TOC entry 5011 (class 1259 OID 123274)
-- Name: AuditTrail_saleId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AuditTrail_saleId_idx" ON public."AuditTrail" USING btree ("saleId");


--
-- TOC entry 5012 (class 1259 OID 123272)
-- Name: AuditTrail_tableName_recordId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AuditTrail_tableName_recordId_idx" ON public."AuditTrail" USING btree ("tableName", "recordId");


--
-- TOC entry 4903 (class 1259 OID 91807)
-- Name: Branch_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Branch_code_key" ON public."Branch" USING btree (code);


--
-- TOC entry 4904 (class 1259 OID 91806)
-- Name: Branch_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Branch_name_key" ON public."Branch" USING btree (name);


--
-- TOC entry 4905 (class 1259 OID 91808)
-- Name: Branch_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Branch_userId_idx" ON public."Branch" USING btree ("userId");


--
-- TOC entry 4970 (class 1259 OID 92040)
-- Name: BulkPurchaseItem_bulkPurchaseId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "BulkPurchaseItem_bulkPurchaseId_idx" ON public."BulkPurchaseItem" USING btree ("bulkPurchaseId");


--
-- TOC entry 4971 (class 1259 OID 92041)
-- Name: BulkPurchaseItem_productId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "BulkPurchaseItem_productId_idx" ON public."BulkPurchaseItem" USING btree ("productId");


--
-- TOC entry 4927 (class 1259 OID 91883)
-- Name: BulkPurchase_contactId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "BulkPurchase_contactId_idx" ON public."BulkPurchase" USING btree ("contactId");


--
-- TOC entry 4928 (class 1259 OID 91881)
-- Name: BulkPurchase_invoiceNumber_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "BulkPurchase_invoiceNumber_key" ON public."BulkPurchase" USING btree ("invoiceNumber");


--
-- TOC entry 4929 (class 1259 OID 91882)
-- Name: BulkPurchase_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "BulkPurchase_userId_idx" ON public."BulkPurchase" USING btree ("userId");


--
-- TOC entry 4908 (class 1259 OID 91820)
-- Name: Category_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Category_userId_idx" ON public."Category" USING btree ("userId");


--
-- TOC entry 4909 (class 1259 OID 91821)
-- Name: Category_userId_name_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Category_userId_name_idx" ON public."Category" USING btree ("userId", name);


--
-- TOC entry 4910 (class 1259 OID 91819)
-- Name: Category_userId_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Category_userId_name_key" ON public."Category" USING btree ("userId", name);


--
-- TOC entry 4897 (class 1259 OID 91797)
-- Name: Contact_phoneNumber_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Contact_phoneNumber_idx" ON public."Contact" USING btree ("phoneNumber");


--
-- TOC entry 4898 (class 1259 OID 91794)
-- Name: Contact_userId_contactType_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Contact_userId_contactType_idx" ON public."Contact" USING btree ("userId", "contactType");


--
-- TOC entry 4899 (class 1259 OID 91795)
-- Name: Contact_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Contact_userId_idx" ON public."Contact" USING btree ("userId");


--
-- TOC entry 4900 (class 1259 OID 91796)
-- Name: Contact_userId_name_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Contact_userId_name_idx" ON public."Contact" USING btree ("userId", name);


--
-- TOC entry 4893 (class 1259 OID 91783)
-- Name: Customer_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Customer_userId_idx" ON public."Customer" USING btree ("userId");


--
-- TOC entry 4894 (class 1259 OID 91784)
-- Name: Customer_userId_phone_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Customer_userId_phone_idx" ON public."Customer" USING btree ("userId", phone);


--
-- TOC entry 4913 (class 1259 OID 91838)
-- Name: Employee_branchId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Employee_branchId_idx" ON public."Employee" USING btree ("branchId");


--
-- TOC entry 4914 (class 1259 OID 91837)
-- Name: Employee_email_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Employee_email_idx" ON public."Employee" USING btree (email);


--
-- TOC entry 4915 (class 1259 OID 91835)
-- Name: Employee_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Employee_email_key" ON public."Employee" USING btree (email);


--
-- TOC entry 4916 (class 1259 OID 91836)
-- Name: Employee_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Employee_userId_idx" ON public."Employee" USING btree ("userId");


--
-- TOC entry 4932 (class 1259 OID 91906)
-- Name: Expense_contactId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Expense_contactId_idx" ON public."Expense" USING btree ("contactId");


--
-- TOC entry 4933 (class 1259 OID 91903)
-- Name: Expense_productId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Expense_productId_idx" ON public."Expense" USING btree ("productId");


--
-- TOC entry 4934 (class 1259 OID 91905)
-- Name: Expense_userId_date_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Expense_userId_date_idx" ON public."Expense" USING btree ("userId", date);


--
-- TOC entry 4935 (class 1259 OID 91904)
-- Name: Expense_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Expense_userId_idx" ON public."Expense" USING btree ("userId");


--
-- TOC entry 4881 (class 1259 OID 91747)
-- Name: License_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "License_userId_idx" ON public."License" USING btree ("userId");


--
-- TOC entry 4882 (class 1259 OID 91746)
-- Name: License_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "License_userId_key" ON public."License" USING btree ("userId");


--
-- TOC entry 4938 (class 1259 OID 91922)
-- Name: LoanTransaction_contactId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "LoanTransaction_contactId_idx" ON public."LoanTransaction" USING btree ("contactId");


--
-- TOC entry 4939 (class 1259 OID 91921)
-- Name: LoanTransaction_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "LoanTransaction_userId_idx" ON public."LoanTransaction" USING btree ("userId");


--
-- TOC entry 4980 (class 1259 OID 92082)
-- Name: Manufacturing_recipeId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Manufacturing_recipeId_idx" ON public."Manufacturing" USING btree ("recipeId");


--
-- TOC entry 4981 (class 1259 OID 92081)
-- Name: Manufacturing_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Manufacturing_userId_idx" ON public."Manufacturing" USING btree ("userId");


--
-- TOC entry 4982 (class 1259 OID 92083)
-- Name: Manufacturing_userId_productionDate_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Manufacturing_userId_productionDate_idx" ON public."Manufacturing" USING btree ("userId", "productionDate");


--
-- TOC entry 4942 (class 1259 OID 91934)
-- Name: MenuCategory_userId_displayOrder_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "MenuCategory_userId_displayOrder_idx" ON public."MenuCategory" USING btree ("userId", "displayOrder");


--
-- TOC entry 4943 (class 1259 OID 91933)
-- Name: MenuCategory_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "MenuCategory_userId_idx" ON public."MenuCategory" USING btree ("userId");


--
-- TOC entry 4944 (class 1259 OID 91935)
-- Name: MenuCategory_userId_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "MenuCategory_userId_name_key" ON public."MenuCategory" USING btree ("userId", name);


--
-- TOC entry 4974 (class 1259 OID 92063)
-- Name: MenuItem_categoryId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "MenuItem_categoryId_idx" ON public."MenuItem" USING btree ("categoryId");


--
-- TOC entry 4975 (class 1259 OID 92064)
-- Name: MenuItem_productId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "MenuItem_productId_idx" ON public."MenuItem" USING btree ("productId");


--
-- TOC entry 4976 (class 1259 OID 92062)
-- Name: MenuItem_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "MenuItem_userId_idx" ON public."MenuItem" USING btree ("userId");


--
-- TOC entry 4977 (class 1259 OID 92065)
-- Name: MenuItem_userId_productId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "MenuItem_userId_productId_key" ON public."MenuItem" USING btree ("userId", "productId");


--
-- TOC entry 4989 (class 1259 OID 92124)
-- Name: OrderItem_orderId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "OrderItem_orderId_idx" ON public."OrderItem" USING btree ("orderId");


--
-- TOC entry 4990 (class 1259 OID 92125)
-- Name: OrderItem_productId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "OrderItem_productId_idx" ON public."OrderItem" USING btree ("productId");


--
-- TOC entry 4991 (class 1259 OID 92126)
-- Name: OrderItem_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "OrderItem_status_idx" ON public."OrderItem" USING btree (status);


--
-- TOC entry 4952 (class 1259 OID 91979)
-- Name: Order_customerId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Order_customerId_idx" ON public."Order" USING btree ("customerId");


--
-- TOC entry 4953 (class 1259 OID 91975)
-- Name: Order_orderNumber_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Order_orderNumber_key" ON public."Order" USING btree ("orderNumber");


--
-- TOC entry 4954 (class 1259 OID 91978)
-- Name: Order_tableId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Order_tableId_idx" ON public."Order" USING btree ("tableId");


--
-- TOC entry 4955 (class 1259 OID 91980)
-- Name: Order_userId_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Order_userId_createdAt_idx" ON public."Order" USING btree ("userId", "createdAt");


--
-- TOC entry 4956 (class 1259 OID 91976)
-- Name: Order_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Order_userId_idx" ON public."Order" USING btree ("userId");


--
-- TOC entry 4957 (class 1259 OID 91977)
-- Name: Order_userId_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Order_userId_status_idx" ON public."Order" USING btree ("userId", status);


--
-- TOC entry 4919 (class 1259 OID 91865)
-- Name: Product_categoryId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Product_categoryId_idx" ON public."Product" USING btree ("categoryId");


--
-- TOC entry 4920 (class 1259 OID 91862)
-- Name: Product_userId_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Product_userId_createdAt_idx" ON public."Product" USING btree ("userId", "createdAt");


--
-- TOC entry 4921 (class 1259 OID 91860)
-- Name: Product_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Product_userId_idx" ON public."Product" USING btree ("userId");


--
-- TOC entry 4922 (class 1259 OID 91861)
-- Name: Product_userId_name_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Product_userId_name_idx" ON public."Product" USING btree ("userId", name);


--
-- TOC entry 4923 (class 1259 OID 91863)
-- Name: Product_userId_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Product_userId_name_key" ON public."Product" USING btree ("userId", name);


--
-- TOC entry 4924 (class 1259 OID 91864)
-- Name: Product_userId_quantity_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Product_userId_quantity_idx" ON public."Product" USING btree ("userId", quantity);


--
-- TOC entry 4985 (class 1259 OID 92104)
-- Name: RecipeItem_rawMaterialId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "RecipeItem_rawMaterialId_idx" ON public."RecipeItem" USING btree ("rawMaterialId");


--
-- TOC entry 4986 (class 1259 OID 92103)
-- Name: RecipeItem_recipeId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "RecipeItem_recipeId_idx" ON public."RecipeItem" USING btree ("recipeId");


--
-- TOC entry 4947 (class 1259 OID 91949)
-- Name: Recipe_productId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Recipe_productId_key" ON public."Recipe" USING btree ("productId");


--
-- TOC entry 4948 (class 1259 OID 91950)
-- Name: Recipe_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Recipe_userId_idx" ON public."Recipe" USING btree ("userId");


--
-- TOC entry 4949 (class 1259 OID 91951)
-- Name: Recipe_userId_name_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Recipe_userId_name_idx" ON public."Recipe" USING btree ("userId", name);


--
-- TOC entry 4994 (class 1259 OID 92148)
-- Name: SaleItem_productId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SaleItem_productId_idx" ON public."SaleItem" USING btree ("productId");


--
-- TOC entry 4995 (class 1259 OID 92147)
-- Name: SaleItem_saleId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SaleItem_saleId_idx" ON public."SaleItem" USING btree ("saleId");


--
-- TOC entry 5003 (class 1259 OID 92187)
-- Name: SaleReturnItem_productId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SaleReturnItem_productId_idx" ON public."SaleReturnItem" USING btree ("productId");


--
-- TOC entry 5004 (class 1259 OID 92186)
-- Name: SaleReturnItem_saleReturnId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SaleReturnItem_saleReturnId_idx" ON public."SaleReturnItem" USING btree ("saleReturnId");


--
-- TOC entry 4998 (class 1259 OID 92165)
-- Name: SaleReturn_returnNumber_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "SaleReturn_returnNumber_key" ON public."SaleReturn" USING btree ("returnNumber");


--
-- TOC entry 4999 (class 1259 OID 92167)
-- Name: SaleReturn_saleId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SaleReturn_saleId_idx" ON public."SaleReturn" USING btree ("saleId");


--
-- TOC entry 5000 (class 1259 OID 92166)
-- Name: SaleReturn_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SaleReturn_userId_idx" ON public."SaleReturn" USING btree ("userId");


--
-- TOC entry 4960 (class 1259 OID 92015)
-- Name: Sale_billNumber_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Sale_billNumber_key" ON public."Sale" USING btree ("billNumber");


--
-- TOC entry 4961 (class 1259 OID 92019)
-- Name: Sale_contactId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Sale_contactId_idx" ON public."Sale" USING btree ("contactId");


--
-- TOC entry 4962 (class 1259 OID 92020)
-- Name: Sale_employeeId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Sale_employeeId_idx" ON public."Sale" USING btree ("employeeId");


--
-- TOC entry 4963 (class 1259 OID 92013)
-- Name: Sale_orderId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Sale_orderId_idx" ON public."Sale" USING btree ("orderId");


--
-- TOC entry 4964 (class 1259 OID 92014)
-- Name: Sale_tableId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Sale_tableId_idx" ON public."Sale" USING btree ("tableId");


--
-- TOC entry 4965 (class 1259 OID 92018)
-- Name: Sale_userId_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Sale_userId_createdAt_idx" ON public."Sale" USING btree ("userId", "createdAt");


--
-- TOC entry 4966 (class 1259 OID 92016)
-- Name: Sale_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Sale_userId_idx" ON public."Sale" USING btree ("userId");


--
-- TOC entry 4967 (class 1259 OID 92017)
-- Name: Sale_userId_saleDate_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Sale_userId_saleDate_idx" ON public."Sale" USING btree ("userId", "saleDate");


--
-- TOC entry 4885 (class 1259 OID 91759)
-- Name: ShopSettings_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ShopSettings_userId_idx" ON public."ShopSettings" USING btree ("userId");


--
-- TOC entry 4888 (class 1259 OID 91769)
-- Name: Table_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Table_userId_idx" ON public."Table" USING btree ("userId");


--
-- TOC entry 4889 (class 1259 OID 91770)
-- Name: Table_userId_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Table_userId_status_idx" ON public."Table" USING btree ("userId", status);


--
-- TOC entry 4890 (class 1259 OID 91771)
-- Name: Table_userId_tableNumber_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Table_userId_tableNumber_key" ON public."Table" USING btree ("userId", "tableNumber");


--
-- TOC entry 4874 (class 1259 OID 91726)
-- Name: User_email_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "User_email_idx" ON public."User" USING btree (email);


--
-- TOC entry 4875 (class 1259 OID 91725)
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- TOC entry 4876 (class 1259 OID 91727)
-- Name: User_role_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "User_role_idx" ON public."User" USING btree (role);


--
-- TOC entry 5040 (class 2606 OID 123281)
-- Name: AuditTrail AuditTrail_purchaseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AuditTrail"
    ADD CONSTRAINT "AuditTrail_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES public."BulkPurchase"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5041 (class 2606 OID 123276)
-- Name: AuditTrail AuditTrail_saleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AuditTrail"
    ADD CONSTRAINT "AuditTrail_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES public."Sale"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5015 (class 2606 OID 91876)
-- Name: BulkPurchase bulkpurchase_contactid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BulkPurchase"
    ADD CONSTRAINT bulkpurchase_contactid_fkey FOREIGN KEY ("contactId") REFERENCES public."Contact"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5026 (class 2606 OID 92030)
-- Name: BulkPurchaseItem bulkpurchaseitem_bulkpurchaseid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BulkPurchaseItem"
    ADD CONSTRAINT bulkpurchaseitem_bulkpurchaseid_fkey FOREIGN KEY ("bulkPurchaseId") REFERENCES public."BulkPurchase"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5027 (class 2606 OID 92035)
-- Name: BulkPurchaseItem bulkpurchaseitem_productid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BulkPurchaseItem"
    ADD CONSTRAINT bulkpurchaseitem_productid_fkey FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5013 (class 2606 OID 91830)
-- Name: Employee employee_branchid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Employee"
    ADD CONSTRAINT employee_branchid_fkey FOREIGN KEY ("branchId") REFERENCES public."Branch"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5016 (class 2606 OID 91893)
-- Name: Expense expense_contactid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Expense"
    ADD CONSTRAINT expense_contactid_fkey FOREIGN KEY ("contactId") REFERENCES public."Contact"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 5017 (class 2606 OID 91898)
-- Name: Expense expense_productid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Expense"
    ADD CONSTRAINT expense_productid_fkey FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 5018 (class 2606 OID 91916)
-- Name: LoanTransaction loantransaction_contactid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."LoanTransaction"
    ADD CONSTRAINT loantransaction_contactid_fkey FOREIGN KEY ("contactId") REFERENCES public."Contact"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5030 (class 2606 OID 92076)
-- Name: Manufacturing manufacturing_recipeid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Manufacturing"
    ADD CONSTRAINT manufacturing_recipeid_fkey FOREIGN KEY ("recipeId") REFERENCES public."Recipe"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5028 (class 2606 OID 92052)
-- Name: MenuItem menuitem_categoryid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MenuItem"
    ADD CONSTRAINT menuitem_categoryid_fkey FOREIGN KEY ("categoryId") REFERENCES public."MenuCategory"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5029 (class 2606 OID 92057)
-- Name: MenuItem menuitem_productid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MenuItem"
    ADD CONSTRAINT menuitem_productid_fkey FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5020 (class 2606 OID 91965)
-- Name: Order order_customerid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT order_customerid_fkey FOREIGN KEY ("customerId") REFERENCES public."Customer"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 5021 (class 2606 OID 91970)
-- Name: Order order_tableid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT order_tableid_fkey FOREIGN KEY ("tableId") REFERENCES public."Table"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 5033 (class 2606 OID 92114)
-- Name: OrderItem orderitem_orderid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT orderitem_orderid_fkey FOREIGN KEY ("orderId") REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5034 (class 2606 OID 92119)
-- Name: OrderItem orderitem_productid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT orderitem_productid_fkey FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5014 (class 2606 OID 91855)
-- Name: Product product_categoryid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT product_categoryid_fkey FOREIGN KEY ("categoryId") REFERENCES public."Category"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 5019 (class 2606 OID 91944)
-- Name: Recipe recipe_productid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Recipe"
    ADD CONSTRAINT recipe_productid_fkey FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5031 (class 2606 OID 92093)
-- Name: RecipeItem recipeitem_rawmaterialid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RecipeItem"
    ADD CONSTRAINT recipeitem_rawmaterialid_fkey FOREIGN KEY ("rawMaterialId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5032 (class 2606 OID 92098)
-- Name: RecipeItem recipeitem_recipeid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RecipeItem"
    ADD CONSTRAINT recipeitem_recipeid_fkey FOREIGN KEY ("recipeId") REFERENCES public."Recipe"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5022 (class 2606 OID 91993)
-- Name: Sale sale_contactid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Sale"
    ADD CONSTRAINT sale_contactid_fkey FOREIGN KEY ("contactId") REFERENCES public."Contact"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 5023 (class 2606 OID 91998)
-- Name: Sale sale_employeeid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Sale"
    ADD CONSTRAINT sale_employeeid_fkey FOREIGN KEY ("employeeId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 5024 (class 2606 OID 92003)
-- Name: Sale sale_orderid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Sale"
    ADD CONSTRAINT sale_orderid_fkey FOREIGN KEY ("orderId") REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 5025 (class 2606 OID 92008)
-- Name: Sale sale_tableid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Sale"
    ADD CONSTRAINT sale_tableid_fkey FOREIGN KEY ("tableId") REFERENCES public."Table"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 5035 (class 2606 OID 92137)
-- Name: SaleItem saleitem_productid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SaleItem"
    ADD CONSTRAINT saleitem_productid_fkey FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5036 (class 2606 OID 92142)
-- Name: SaleItem saleitem_saleid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SaleItem"
    ADD CONSTRAINT saleitem_saleid_fkey FOREIGN KEY ("saleId") REFERENCES public."Sale"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5037 (class 2606 OID 92160)
-- Name: SaleReturn salereturn_saleid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SaleReturn"
    ADD CONSTRAINT salereturn_saleid_fkey FOREIGN KEY ("saleId") REFERENCES public."Sale"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5038 (class 2606 OID 92176)
-- Name: SaleReturnItem salereturnitem_productid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SaleReturnItem"
    ADD CONSTRAINT salereturnitem_productid_fkey FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5039 (class 2606 OID 92181)
-- Name: SaleReturnItem salereturnitem_salereturnid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SaleReturnItem"
    ADD CONSTRAINT salereturnitem_salereturnid_fkey FOREIGN KEY ("saleReturnId") REFERENCES public."SaleReturn"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


-- Completed on 2025-11-02 02:28:09

--
-- PostgreSQL database dump complete
--

