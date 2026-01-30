import { sql, relations } from "drizzle-orm";
import { text, integer, boolean, timestamp, serial, pgTable, json, foreignKey, primaryKey } from "drizzle-orm/pg-core";

// ============================================
// USERS & AUTH
// ============================================

export const roles = pgTable("roles", {
    id: text("id").primaryKey(), // "admin", "teknisi", "kasir"
    name: text("name").notNull(), // "Administrator", "Technician", "Cashier"
    permissions: json("permissions").$type<string[]>().notNull().default([]), // ["service.create", "service.read"]
    createdAt: timestamp("created_at").defaultNow(),
});

export const users = pgTable("users", {
    id: text("id").primaryKey(), // UUID
    username: text("username").notNull().unique(),
    password: text("password").notNull(), // Hashed
    role: text("role").notNull().references(() => roles.id).default("teknisi"),
    name: text("name").notNull(),
    image: text("image"), // Profile photo URL (optional)
    commissionConfig: json("commission_config"), // { type: 'percent' | 'fixed', value: number, enabled: boolean }
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
});

// ============================================
// MASTER DATA
// ============================================

export const categories = pgTable("categories", {
    id: text("id").primaryKey(), // UUID
    name: text("name").notNull(),
    description: text("description"),
    parentId: text("parent_id"), // Self-reference added in relations, or here if using AnyPgColumn trick
    createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
    parentReference: foreignKey({
        columns: [table.parentId],
        foreignColumns: [table.id],
        name: "categories_parent_id_fkey"
    })
}));

export const categoryVariants = pgTable("category_variants", {
    id: serial("id").primaryKey(),
    categoryId: text("category_id").notNull().references(() => categories.id, { onDelete: 'cascade' }),
    name: text("name").notNull(),
    supplierId: text("supplier_id").references(() => suppliers.id),
    createdAt: timestamp("created_at").defaultNow(),
});

export const suppliers = pgTable("suppliers", {
    id: text("id").primaryKey(), // SUP-XXX
    name: text("name").notNull(),
    contact: text("contact"),
    phone: text("phone"),
    address: text("address"),
    image: text("image"), // Supplier logo (optional)
    createdAt: timestamp("created_at").defaultNow(),
});

export const members = pgTable("members", {
    id: text("id").primaryKey(), // MBR-XXX
    name: text("name").notNull(),
    phone: text("phone").notNull().unique(),
    email: text("email"),
    discountPercent: integer("discount_percent").default(0),
    points: integer("points").default(0),
    debt: integer("debt").default(0),
    creditLimit: integer("credit_limit").default(0),
    image: text("image"),
    createdAt: timestamp("created_at").defaultNow(),
});

// ============================================
// INVENTORY
// ============================================

export const products = pgTable("products", {
    id: text("id").primaryKey(), // PRD-XXX
    code: text("code").unique(), // Universal Code (SKU/Barcode)
    name: text("name").notNull(),
    categoryId: text("category_id").references(() => categories.id),
    image: text("image"), // Product photo (optional)
    stock: integer("stock").notNull().default(0),
    minStock: integer("min_stock").default(5),
    createdAt: timestamp("created_at").defaultNow(),
});

export const productVariants = pgTable("product_variants", {
    id: text("id").primaryKey(), // VAR-XXX
    productId: text("product_id").notNull().references(() => products.id),
    name: text("name").notNull(), // e.g. "Original Copotan", "Grade A"
    image: text("image"), // UNIQUE IMAGE per variant
    sku: text("sku"), // specific barcode for this variant
    defaultPrice: integer("default_price"), // Suggested selling price
    createdAt: timestamp("created_at").defaultNow(),
});

export const productBatches = pgTable("product_batches", {
    id: text("id").primaryKey(), // B-XXX
    productId: text("product_id").notNull().references(() => products.id),
    variantId: text("variant_id").references(() => productVariants.id), // Link to defined variant
    supplierId: text("supplier_id").references(() => suppliers.id),
    variant: text("variant"), // Free-text: Original, OEM, Copy (Deprecated/Legacy, use variantId)
    supplierName: text("supplier_name"), // Snapshot for display
    buyPrice: integer("buy_price").notNull(),
    sellPrice: integer("sell_price").notNull(),
    initialStock: integer("initial_stock").notNull(),
    currentStock: integer("current_stock").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at"),
});

// ============================================
// PURCHASES (Stock In)
// ============================================

export const purchases = pgTable("purchases", {
    id: text("id").primaryKey(), // PO-XXX
    supplierId: text("supplier_id").notNull().references(() => suppliers.id),
    userId: text("user_id").references(() => users.id), // Who created
    totalAmount: integer("total_amount").notNull(),
    notes: text("notes"),
    date: timestamp("date").defaultNow(),
});

export const purchaseItems = pgTable("purchase_items", {
    id: serial("id").primaryKey(),
    purchaseId: text("purchase_id").notNull().references(() => purchases.id),
    productId: text("product_id").notNull().references(() => products.id),
    variant: text("variant"),
    qtyOrdered: integer("qty_ordered").notNull(),
    qtyReceived: integer("qty_received").notNull(),
    buyPrice: integer("buy_price").notNull(),
    sellPrice: integer("sell_price").notNull(),
    batchId: text("batch_id").references(() => productBatches.id),
    createdAt: timestamp("created_at").defaultNow(),
});

// ============================================
// SALES (Stock Out)
// ============================================

export const sales = pgTable("sales", {
    id: text("id").primaryKey(), // SAL-XXX
    memberId: text("member_id").references(() => members.id),
    customerName: text("customer_name"), // Walk-in name
    totalAmount: integer("total_amount").notNull(),
    discountAmount: integer("discount_amount").default(0),
    finalAmount: integer("final_amount").notNull(),
    paymentMethod: text("payment_method", { enum: ["cash", "transfer", "qris", "mixed"] }).notNull(),
    paymentStatus: text("payment_status", { enum: ["paid", "partial", "unpaid"] }).notNull().default("paid"),
    userId: text("user_id").notNull().references(() => users.id), // Cashier
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow(),
});

export const saleItems = pgTable("sale_items", {
    id: serial("id").primaryKey(),
    saleId: text("sale_id").notNull().references(() => sales.id),
    productId: text("product_id").notNull().references(() => products.id),
    batchId: text("batch_id").notNull().references(() => productBatches.id),
    variant: text("variant"), // Snapshot
    qty: integer("qty").notNull(),
    price: integer("price").notNull(),
    subtotal: integer("subtotal").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
});

// ============================================
// DEVICES (New Phase 4)
// ============================================

export const devices = pgTable("devices", {
    id: text("id").primaryKey(), // DEV-XXX or UUID
    brand: text("brand").notNull(), // Samsung, Apple
    series: text("series"), // S Series, A Series, etc.
    model: text("model").notNull(), // Galaxy S25, iPhone 16
    code: text("code"), // SM-S921B (Machine Code)
    image: text("image"),
    colors: json("colors").$type<string[]>(), // ["Black", "Blue"]
    specs: text("specs"), // "128GB/256GB" (Internal Storage/RAM)
    chipset: text("chipset"), // "Snapdragon 8 Gen 3"
    specifications: json("specifications").$type<Record<string, any>>(), // Full detailed specs
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at"),
});

export const brands = pgTable("brands", {
    id: text("id").primaryKey(), // "samsung", "apple"
    name: text("name").notNull(), // "Samsung", "Apple"
    logo: text("logo"), // URL to logo
    createdAt: timestamp("created_at").defaultNow(),
});

// Junction Table for Many-to-Many
export const productDeviceCompatibility = pgTable("product_device_compatibility", {
    productId: text("product_id").notNull().references(() => products.id, { onDelete: 'cascade' }),
    deviceId: text("device_id").notNull().references(() => devices.id, { onDelete: 'cascade' }),
}, (t) => ({
    pk: primaryKey({ columns: [t.productId, t.deviceId] }),
}));

// Include in relations imports if not already there, assumed implicit by usage below.


// ============================================
// SERVICE
// ============================================

export const services = pgTable("services", {
    id: serial("id").primaryKey(),
    no: text("no").notNull().unique(), // SRV-YYYY-XXX

    customer: json("customer").notNull().$type<{ name: string; phone: string; address?: string }>(),
    device: json("device").notNull().$type<{ brand: string; model: string; imei?: string; equipment?: string }>(),

    complaint: text("complaint").notNull(),
    diagnosis: text("diagnosis"),
    notes: text("notes"),

    status: text("status", { enum: ["antrian", "dicek", "konfirmasi", "dikerjakan", "re-konfirmasi", "selesai", "diambil", "batal"] }).default("antrian"),

    technicianId: text("technician_id").references(() => users.id),
    createdBy: text("created_by").references(() => users.id), // Who created ticket

    costEstimate: integer("cost_estimate"),
    actualCost: integer("actual_cost"),

    dateIn: timestamp("date_in").defaultNow(),
    dateOut: timestamp("date_out"),
    estimatedCompletionDate: timestamp("estimated_completion_date"),
    parts: json("parts"), // Stores spare parts used
    qc: json("qc"), // Stores final QC data: { passed, before, after, notes }
    reconfirmationCount: integer("reconfirmation_count").default(0),

    warranty: text("warranty"),
    warrantyExpiryDate: timestamp("warranty_expiry_date"),
    priority: text("priority", { enum: ["standard", "wait"] }).default("standard"),
    isDirectComplete: boolean("is_direct_complete").default(false),
});

// ============================================
// ACTIVITY LOGS & NOTIFICATIONS
// ============================================

export const activityLogs = pgTable("activity_logs", {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id),
    action: text("action", { enum: ["CREATE", "UPDATE", "DELETE", "ASSIGN", "STATUS_CHANGE", "LOGIN", "LOGOUT", "EXPORT"] }).notNull(),
    entityType: text("entity_type").notNull(), // service, sale, purchase, product
    entityId: text("entity_id").notNull(),
    oldValue: json("old_value"),
    newValue: json("new_value"),
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow(),
});

export const notifications = pgTable("notifications", {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id),
    type: text("type", { enum: ["low_stock", "service_update", "new_assignment", "sale_complete", "purchase_complete"] }).notNull(),
    title: text("title").notNull(),
    message: text("message").notNull(),
    entityType: text("entity_type"), // service, product, sale
    entityId: text("entity_id"),
    isRead: boolean("is_read").default(false),
    createdAt: timestamp("created_at").defaultNow(),
});

// ============================================
// SETTINGS
// ============================================

export const settings = pgTable("settings", {
    key: text("key").primaryKey(),
    value: json("value").notNull(),
});

// ============================================
// RELATIONS
// ============================================

export const categoriesRelations = relations(categories, ({ one, many }) => ({
    products: many(products),
    parent: one(categories, {
        fields: [categories.parentId],
        references: [categories.id],
        relationName: "category_hierarchy"
    }),
    children: many(categories, {
        relationName: "category_hierarchy"
    }),
    variantTemplates: many(categoryVariants)
}));

export const categoryVariantsRelations = relations(categoryVariants, ({ one }) => ({
    category: one(categories, {
        fields: [categoryVariants.categoryId],
        references: [categories.id],
    }),
    supplier: one(suppliers, {
        fields: [categoryVariants.supplierId],
        references: [suppliers.id],
    }),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
    category: one(categories, {
        fields: [products.categoryId],
        references: [categories.id],
    }),
    batches: many(productBatches),
    purchaseItems: many(purchaseItems),
    saleItems: many(saleItems),
    compatibility: many(productDeviceCompatibility),
    variants: many(productVariants),
}));

export const productVariantsRelations = relations(productVariants, ({ one, many }) => ({
    product: one(products, {
        fields: [productVariants.productId],
        references: [products.id],
    }),
    batches: many(productBatches),
}));

export const devicesRelations = relations(devices, ({ many }) => ({
    compatibleProducts: many(productDeviceCompatibility),
}));

export const productDeviceCompatibilityRelations = relations(productDeviceCompatibility, ({ one }) => ({
    product: one(products, {
        fields: [productDeviceCompatibility.productId],
        references: [products.id],
    }),
    device: one(devices, {
        fields: [productDeviceCompatibility.deviceId],
        references: [devices.id],
    }),
}));

export const suppliersRelations = relations(suppliers, ({ many }) => ({
    purchases: many(purchases),
    batches: many(productBatches),
}));

export const membersRelations = relations(members, ({ many }) => ({
    sales: many(sales),
}));

export const productBatchesRelations = relations(productBatches, ({ one, many }) => ({
    product: one(products, {
        fields: [productBatches.productId],
        references: [products.id],
    }),
    supplier: one(suppliers, {
        fields: [productBatches.supplierId],
        references: [suppliers.id],
    }),
    variantLink: one(productVariants, {
        fields: [productBatches.variantId],
        references: [productVariants.id],
    }),
    purchaseItems: many(purchaseItems),
    saleItems: many(saleItems),
}));

export const purchasesRelations = relations(purchases, ({ one, many }) => ({
    supplier: one(suppliers, {
        fields: [purchases.supplierId],
        references: [suppliers.id],
    }),
    user: one(users, {
        fields: [purchases.userId],
        references: [users.id],
    }),
    items: many(purchaseItems),
}));

export const purchaseItemsRelations = relations(purchaseItems, ({ one }) => ({
    purchase: one(purchases, {
        fields: [purchaseItems.purchaseId],
        references: [purchases.id],
    }),
    product: one(products, {
        fields: [purchaseItems.productId],
        references: [products.id],
    }),
    batch: one(productBatches, {
        fields: [purchaseItems.batchId],
        references: [productBatches.id],
    }),
}));

export const salesRelations = relations(sales, ({ one, many }) => ({
    member: one(members, {
        fields: [sales.memberId],
        references: [members.id],
    }),
    user: one(users, {
        fields: [sales.userId],
        references: [users.id],
    }),
    items: many(saleItems),
    payments: many(salePayments),
}));

export const saleItemsRelations = relations(saleItems, ({ one }) => ({
    sale: one(sales, {
        fields: [saleItems.saleId],
        references: [sales.id],
    }),
    product: one(products, {
        fields: [saleItems.productId],
        references: [products.id],
    }),
    batch: one(productBatches, {
        fields: [saleItems.batchId],
        references: [productBatches.id],
    }),
}));

// ============================================
// PAYMENT METHODS
// ============================================

export const paymentMethods = pgTable("payment_methods", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    type: text("type", { enum: ["cash", "transfer", "qris", "ewallet", "custom"] }).notNull(),
    icon: text("icon").notNull().default("💳"),
    enabled: boolean("enabled").default(true),
    createdAt: timestamp("created_at").defaultNow(),
});

export const paymentVariants = pgTable("payment_variants", {
    id: text("id").primaryKey(),
    methodId: text("method_id").notNull().references(() => paymentMethods.id),
    name: text("name").notNull(),
    accountNumber: text("account_number"),
    accountHolder: text("account_holder"),
    enabled: boolean("enabled").default(true),
    createdAt: timestamp("created_at").defaultNow(),
});

export const paymentMethodsRelations = relations(paymentMethods, ({ many }) => ({
    variants: many(paymentVariants),
    payments: many(salePayments),
}));

export const paymentVariantsRelations = relations(paymentVariants, ({ one }) => ({
    method: one(paymentMethods, {
        fields: [paymentVariants.methodId],
        references: [paymentMethods.id],
    }),
}));

// ============================================
// SALE PAYMENTS
// ============================================

export const salePayments = pgTable("sale_payments", {
    id: serial("id").primaryKey(),
    saleId: text("sale_id").notNull().references(() => sales.id),
    amount: integer("amount").notNull(),
    method: text("method").notNull(), // Snapshot name: "Transfer Bank", "Cash", etc.
    methodId: text("method_id").references(() => paymentMethods.id), // FK to payment_methods
    variantName: text("variant_name"), // Snapshot: "BCA - 1234567890"
    variantId: text("variant_id").references(() => paymentVariants.id), // FK to payment_variants
    reference: text("reference"), // Transfer ref, etc.
    proofImage: text("proof_image"), // Payment proof image
    createdAt: timestamp("created_at").defaultNow(),
});

export const salePaymentsRelations = relations(salePayments, ({ one }) => ({
    sale: one(sales, {
        fields: [salePayments.saleId],
        references: [sales.id],
    }),
    paymentMethod: one(paymentMethods, {
        fields: [salePayments.methodId],
        references: [paymentMethods.id],
    }),
    paymentVariant: one(paymentVariants, {
        fields: [salePayments.variantId],
        references: [paymentVariants.id],
    }),
}));

export const servicesRelations = relations(services, ({ one }) => ({
    technician: one(users, {
        fields: [services.technicianId],
        references: [users.id],
    }),
    creator: one(users, {
        fields: [services.createdBy],
        references: [users.id],
    }),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
    users: many(users),
}));

export const usersRelations = relations(users, ({ many, one }) => ({
    role: one(roles, {
        fields: [users.role],
        references: [roles.id],
    }),
    services: many(services),
    sales: many(sales),
    purchases: many(purchases),
    activityLogs: many(activityLogs),
    notifications: many(notifications),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
    user: one(users, {
        fields: [activityLogs.userId],
        references: [users.id],
    }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
    user: one(users, {
        fields: [notifications.userId],
        references: [users.id],
    }),
}));

// ============================================
// PURCHASE RETURNS
// ============================================

export const purchaseReturns = pgTable("purchase_returns", {
    id: text("id").primaryKey(), // RET-XXX
    supplierId: text("supplier_id").notNull().references(() => suppliers.id),
    userId: text("user_id").notNull().references(() => users.id),
    date: timestamp("date").defaultNow(),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow(),
});

export const purchaseReturnItems = pgTable("purchase_return_items", {
    id: serial("id").primaryKey(),
    returnId: text("return_id").notNull().references(() => purchaseReturns.id),
    productId: text("product_id").notNull().references(() => products.id),
    batchId: text("batch_id").notNull().references(() => productBatches.id),
    qty: integer("qty").notNull(),
    reason: text("reason"),
    createdAt: timestamp("created_at").defaultNow(),
});

export const purchaseReturnsRelations = relations(purchaseReturns, ({ one, many }) => ({
    supplier: one(suppliers, {
        fields: [purchaseReturns.supplierId],
        references: [suppliers.id],
    }),
    user: one(users, {
        fields: [purchaseReturns.userId],
        references: [users.id],
    }),
    items: many(purchaseReturnItems),
}));

export const purchaseReturnItemsRelations = relations(purchaseReturnItems, ({ one }) => ({
    return: one(purchaseReturns, {
        fields: [purchaseReturnItems.returnId],
        references: [purchaseReturns.id],
    }),
    product: one(products, {
        fields: [purchaseReturnItems.productId],
        references: [products.id],
    }),
    batch: one(productBatches, {
        fields: [purchaseReturnItems.batchId],
        references: [productBatches.id],
    }),
}));

// ============================================
// DEFECTIVE ITEMS (Gudang Retur)
// ============================================

export const defectiveItems = pgTable("defective_items", {
    id: text("id").primaryKey(), // DEF-XXX
    productId: text("product_id").notNull().references(() => products.id),
    batchId: text("batch_id").notNull().references(() => productBatches.id),
    supplierId: text("supplier_id").notNull().references(() => suppliers.id),
    qty: integer("qty").notNull(),
    source: text("source").notNull(), // manual, sales_return, service_return
    sourceRefId: text("source_ref_id"),
    reason: text("reason"),
    status: text("status").notNull().default("pending"), // pending, processed
    createdAt: timestamp("created_at").defaultNow(),
});

export const defectiveItemsRelations = relations(defectiveItems, ({ one }) => ({
    product: one(products, {
        fields: [defectiveItems.productId],
        references: [products.id],
    }),
    batch: one(productBatches, {
        fields: [defectiveItems.batchId],
        references: [productBatches.id],
    }),
    supplier: one(suppliers, {
        fields: [defectiveItems.supplierId],
        references: [suppliers.id],
    }),
}));

// ============================================
// OPERATIONAL COSTS
// ============================================

export const operationalCosts = pgTable("operational_costs", {
    id: serial("id").primaryKey(),
    category: text("category").notNull(), // "Listrik", "Sewa", "Konsumsi", "Internet", "Lainnya"
    amount: integer("amount").notNull(),
    date: timestamp("date").defaultNow(),
    description: text("description"),
    userId: text("user_id").references(() => users.id),
    createdAt: timestamp("created_at").defaultNow(),
});

export const operationalCostsRelations = relations(operationalCosts, ({ one }) => ({
    user: one(users, {
        fields: [operationalCosts.userId],
        references: [users.id],
    }),
}));

// ============================================
// SERVICE TOOLS (Assets)
// ============================================

// ============================================
// STOCK OPNAME
// ============================================

export const stockOpnameSessions = pgTable("stock_opname_sessions", {
    id: text("id").primaryKey(), // SO-YYYYMMDD-XXX
    status: text("status", { enum: ["draft", "completed", "cancelled"] }).default("draft"),
    userId: text("user_id").notNull().references(() => users.id),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow(),
    completedAt: timestamp("completed_at"),
});

export const stockOpnameItems = pgTable("stock_opname_items", {
    id: serial("id").primaryKey(),
    sessionId: text("session_id").notNull().references(() => stockOpnameSessions.id, { onDelete: 'cascade' }),
    productId: text("product_id").notNull().references(() => products.id),
    variantName: text("variant_name"), // e.g. "iPhone 13 - Black"
    batchId: text("batch_id").references(() => productBatches.id), // Nullable if grouped
    systemStock: integer("system_stock").notNull(),
    physicalStock: integer("physical_stock"),
    difference: integer("difference"), // physical - system
    adjustmentReason: text("adjustment_reason"),
});

export const stockOpnameSessionsRelations = relations(stockOpnameSessions, ({ one, many }) => ({
    user: one(users, {
        fields: [stockOpnameSessions.userId],
        references: [users.id],
    }),
    items: many(stockOpnameItems),
}));

export const stockOpnameItemsRelations = relations(stockOpnameItems, ({ one }) => ({
    session: one(stockOpnameSessions, {
        fields: [stockOpnameItems.sessionId],
        references: [stockOpnameSessions.id],
    }),
    product: one(products, {
        fields: [stockOpnameItems.productId],
        references: [products.id],
    }),
    batch: one(productBatches, {
        fields: [stockOpnameItems.batchId],
        references: [productBatches.id],
    }),
}));

export const serviceTools = pgTable("service_tools", {
    id: text("id").primaryKey(), // TOOL-XXX
    name: text("name").notNull(),
    brand: text("brand"),
    qty: integer("qty").notNull().default(1),
    condition: text("condition", { enum: ["good", "damaged", "lost"] }).default("good"),
    purchaseDate: timestamp("purchase_date"),
    price: integer("price"), // Asset value
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow(),
});

// ============================================
// ACCOUNTING - CHART OF ACCOUNTS
// ============================================

export const accountTypes = pgTable("account_types", {
    id: text("id").primaryKey(), // "ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"
    name: text("name").notNull(), // "Aset", "Kewajiban", "Modal", "Pendapatan", "Beban"
    normalBalance: text("normal_balance", { enum: ["debit", "credit"] }).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
});

export const accounts = pgTable("accounts", {
    id: text("id").primaryKey(), // "1-1001"
    code: text("code").notNull().unique(), // "1001"
    name: text("name").notNull(), // "Kas Toko"
    typeId: text("type_id").notNull().references(() => accountTypes.id),
    parentId: text("parent_id"), // For sub-accounts
    description: text("description"),
    isActive: boolean("is_active").default(true),
    balance: integer("balance").notNull().default(0), // Current balance
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at"),
}, (table) => ({
    parentReference: foreignKey({
        columns: [table.parentId],
        foreignColumns: [table.id],
        name: "accounts_parent_id_fkey"
    })
}));

// ============================================
// ACCOUNTING - JOURNAL ENTRIES (DOUBLE-ENTRY)
// ============================================

export const journals = pgTable("journals", {
    id: text("id").primaryKey(), // "JRN-YYYYMMDD-XXX"
    date: timestamp("date").notNull().defaultNow(),
    description: text("description").notNull(),
    referenceType: text("reference_type"), // "sale", "purchase", "expense", "service", "depreciation"
    referenceId: text("reference_id"),
    status: text("status", { enum: ["draft", "posted", "voided"] }).default("posted"),
    totalDebit: integer("total_debit").notNull().default(0),
    totalCredit: integer("total_credit").notNull().default(0),
    isAutoGenerated: boolean("is_auto_generated").default(true),
    createdBy: text("created_by").references(() => users.id),
    postedBy: text("posted_by").references(() => users.id),
    postedAt: timestamp("posted_at"),
    voidedBy: text("voided_by").references(() => users.id),
    voidedAt: timestamp("voided_at"),
    voidReason: text("void_reason"),
    createdAt: timestamp("created_at").defaultNow(),
});

export const journalLines = pgTable("journal_lines", {
    id: serial("id").primaryKey(),
    journalId: text("journal_id").notNull().references(() => journals.id, { onDelete: 'cascade' }),
    accountId: text("account_id").notNull().references(() => accounts.id),
    debit: integer("debit").notNull().default(0),
    credit: integer("credit").notNull().default(0),
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow(),
});

// ============================================
// ACCOUNTING - FIXED ASSETS & DEPRECIATION
// ============================================

export const assets = pgTable("assets", {
    id: text("id").primaryKey(), // "AST-XXX"
    name: text("name").notNull(),
    category: text("category", { enum: ["tool", "equipment", "furniture", "vehicle", "building", "land", "other"] }).notNull(),
    purchaseDate: timestamp("purchase_date").notNull(),
    purchaseCost: integer("purchase_cost").notNull(),
    salvageValue: integer("salvage_value").notNull().default(0),
    usefulLifeMonths: integer("useful_life_months").notNull(),
    depreciationMethod: text("depreciation_method", { enum: ["straight_line"] }).default("straight_line"),
    monthlyDepreciation: integer("monthly_depreciation").notNull().default(0),
    accumulatedDepreciation: integer("accumulated_depreciation").notNull().default(0),
    currentValue: integer("current_value").notNull().default(0),
    status: text("status", { enum: ["active", "disposed", "fully_depreciated"] }).default("active"),
    accountId: text("account_id").references(() => accounts.id),
    depreciationAccountId: text("depreciation_account_id").references(() => accounts.id),
    notes: text("notes"),
    createdBy: text("created_by").references(() => users.id),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at"),
});

export const assetDepreciationLogs = pgTable("asset_depreciation_logs", {
    id: serial("id").primaryKey(),
    assetId: text("asset_id").notNull().references(() => assets.id, { onDelete: 'cascade' }),
    period: text("period").notNull(), // "2026-01"
    amount: integer("amount").notNull(),
    valueAfter: integer("value_after").notNull(),
    journalId: text("journal_id").references(() => journals.id),
    createdAt: timestamp("created_at").defaultNow(),
});

// ============================================
// ACCOUNTING - CASH REGISTER
// ============================================

export const cashRegisters = pgTable("cash_registers", {
    id: text("id").primaryKey(), // "REG-YYYYMMDD-XXX"
    date: timestamp("date").notNull(),
    openedBy: text("opened_by").notNull().references(() => users.id),
    closedBy: text("closed_by").references(() => users.id),
    openingBalance: integer("opening_balance").notNull(),
    expectedClosing: integer("expected_closing").notNull().default(0),
    actualClosing: integer("actual_closing"),
    difference: integer("difference"),
    status: text("status", { enum: ["open", "closed"] }).default("open"),
    notes: text("notes"),
    openedAt: timestamp("opened_at").defaultNow(),
    closedAt: timestamp("closed_at"),
});

export const cashRegisterTransactions = pgTable("cash_register_transactions", {
    id: serial("id").primaryKey(),
    registerId: text("register_id").notNull().references(() => cashRegisters.id, { onDelete: 'cascade' }),
    transactionType: text("transaction_type", { enum: ["sale", "service", "expense", "refund", "adjustment"] }).notNull(),
    transactionId: text("transaction_id"),
    paymentMethod: text("payment_method").notNull(),
    amount: integer("amount").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow(),
});

// ============================================
// ACCOUNTING - REVENUE TARGETS
// ============================================

export const revenueTargets = pgTable("revenue_targets", {
    id: serial("id").primaryKey(),
    month: text("month").notNull().unique(), // "2026-01"
    workingDays: integer("working_days").notNull().default(26),
    monthlyOperational: integer("monthly_operational").notNull().default(0),
    monthlyDepreciation: integer("monthly_depreciation").notNull().default(0),
    monthlyTotal: integer("monthly_total").notNull().default(0),
    dailyBreakeven: integer("daily_breakeven").notNull().default(0),
    profitMarginPercent: integer("profit_margin_percent").notNull().default(20),
    dailyTarget: integer("daily_target").notNull().default(0),
    createdBy: text("created_by").references(() => users.id),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at"),
});

// ============================================
// ACCOUNTING - SUPPLIER PAYMENTS (AP)
// ============================================

export const purchasePayments = pgTable("purchase_payments", {
    id: serial("id").primaryKey(),
    purchaseId: text("purchase_id").notNull().references(() => purchases.id),
    supplierId: text("supplier_id").notNull().references(() => suppliers.id),
    amount: integer("amount").notNull(),
    method: text("method").notNull(),
    accountId: text("account_id").references(() => accounts.id),
    reference: text("reference"),
    date: timestamp("date").notNull().defaultNow(),
    journalId: text("journal_id").references(() => journals.id),
    createdBy: text("created_by").references(() => users.id),
    createdAt: timestamp("created_at").defaultNow(),
});

// ============================================
// ACCOUNTING - PERIOD CLOSING
// ============================================

export const periodLocks = pgTable("period_locks", {
    id: serial("id").primaryKey(),
    period: text("period").notNull().unique(), // "2026-01"
    status: text("status", { enum: ["open", "closed"] }).default("open"),
    closedBy: text("closed_by").references(() => users.id),
    closedAt: timestamp("closed_at"),
    salesTotal: integer("sales_total").default(0),
    purchasesTotal: integer("purchases_total").default(0),
    expensesTotal: integer("expenses_total").default(0),
    servicesTotal: integer("services_total").default(0),
    createdAt: timestamp("created_at").defaultNow(),
});

// ============================================
// ACCOUNTING - COMMISSION PAYMENTS
// ============================================

export const commissionPayments = pgTable("commission_payments", {
    id: serial("id").primaryKey(),
    technicianId: text("technician_id").notNull().references(() => users.id),
    period: text("period").notNull(), // "2026-01"
    serviceIds: json("service_ids").$type<number[]>().notNull().default([]),
    amount: integer("amount").notNull(),
    status: text("status", { enum: ["pending", "paid"] }).default("pending"),
    paidBy: text("paid_by").references(() => users.id),
    paidAt: timestamp("paid_at"),
    journalId: text("journal_id").references(() => journals.id),
    accountId: text("account_id").references(() => accounts.id),
    createdAt: timestamp("created_at").defaultNow(),
});

// ============================================
// ACCOUNTING - AUDIT LOGS
// ============================================

export const auditLogs = pgTable("audit_logs", {
    id: serial("id").primaryKey(),
    timestamp: timestamp("timestamp").notNull().defaultNow(),
    userId: text("user_id").references(() => users.id),
    action: text("action", { enum: ["CREATE", "UPDATE", "DELETE", "VOID", "POST", "CLOSE", "PAY"] }).notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    tableName: text("table_name").notNull(),
    oldValues: json("old_values"),
    newValues: json("new_values"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    reason: text("reason"),
    createdAt: timestamp("created_at").defaultNow(),
});

// ============================================
// ACCOUNTING - RELATIONS
// ============================================

export const accountTypesRelations = relations(accountTypes, ({ many }) => ({
    accounts: many(accounts),
}));

export const accountsRelations = relations(accounts, ({ one, many }) => ({
    type: one(accountTypes, {
        fields: [accounts.typeId],
        references: [accountTypes.id],
    }),
    parent: one(accounts, {
        fields: [accounts.parentId],
        references: [accounts.id],
        relationName: "account_hierarchy"
    }),
    children: many(accounts, {
        relationName: "account_hierarchy"
    }),
    journalLines: many(journalLines),
}));

export const journalsRelations = relations(journals, ({ one, many }) => ({
    createdByUser: one(users, {
        fields: [journals.createdBy],
        references: [users.id],
    }),
    lines: many(journalLines),
}));

export const journalLinesRelations = relations(journalLines, ({ one }) => ({
    journal: one(journals, {
        fields: [journalLines.journalId],
        references: [journals.id],
    }),
    account: one(accounts, {
        fields: [journalLines.accountId],
        references: [accounts.id],
    }),
}));

export const assetsRelations = relations(assets, ({ one, many }) => ({
    account: one(accounts, {
        fields: [assets.accountId],
        references: [accounts.id],
    }),
    depreciationAccount: one(accounts, {
        fields: [assets.depreciationAccountId],
        references: [accounts.id],
    }),
    depreciationLogs: many(assetDepreciationLogs),
    createdByUser: one(users, {
        fields: [assets.createdBy],
        references: [users.id],
    }),
}));

export const assetDepreciationLogsRelations = relations(assetDepreciationLogs, ({ one }) => ({
    asset: one(assets, {
        fields: [assetDepreciationLogs.assetId],
        references: [assets.id],
    }),
    journal: one(journals, {
        fields: [assetDepreciationLogs.journalId],
        references: [journals.id],
    }),
}));

export const cashRegistersRelations = relations(cashRegisters, ({ one, many }) => ({
    openedByUser: one(users, {
        fields: [cashRegisters.openedBy],
        references: [users.id],
    }),
    closedByUser: one(users, {
        fields: [cashRegisters.closedBy],
        references: [users.id],
    }),
    transactions: many(cashRegisterTransactions),
}));

export const cashRegisterTransactionsRelations = relations(cashRegisterTransactions, ({ one }) => ({
    register: one(cashRegisters, {
        fields: [cashRegisterTransactions.registerId],
        references: [cashRegisters.id],
    }),
}));

export const purchasePaymentsRelations = relations(purchasePayments, ({ one }) => ({
    purchase: one(purchases, {
        fields: [purchasePayments.purchaseId],
        references: [purchases.id],
    }),
    supplier: one(suppliers, {
        fields: [purchasePayments.supplierId],
        references: [suppliers.id],
    }),
    account: one(accounts, {
        fields: [purchasePayments.accountId],
        references: [accounts.id],
    }),
    journal: one(journals, {
        fields: [purchasePayments.journalId],
        references: [journals.id],
    }),
    createdByUser: one(users, {
        fields: [purchasePayments.createdBy],
        references: [users.id],
    }),
}));

export const commissionPaymentsRelations = relations(commissionPayments, ({ one }) => ({
    technician: one(users, {
        fields: [commissionPayments.technicianId],
        references: [users.id],
    }),
    paidByUser: one(users, {
        fields: [commissionPayments.paidBy],
        references: [users.id],
    }),
    journal: one(journals, {
        fields: [commissionPayments.journalId],
        references: [journals.id],
    }),
    account: one(accounts, {
        fields: [commissionPayments.accountId],
        references: [accounts.id],
    }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
    user: one(users, {
        fields: [auditLogs.userId],
        references: [users.id],
    }),
}));
