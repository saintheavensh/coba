import { sql, relations } from "drizzle-orm";
import { text, integer, sqliteTable } from "drizzle-orm/sqlite-core";

// ============================================
// USERS & AUTH
// ============================================

export const users = sqliteTable("users", {
    id: text("id").primaryKey(), // UUID
    username: text("username").notNull().unique(),
    password: text("password").notNull(), // Hashed
    role: text("role", { enum: ["admin", "teknisi", "kasir"] }).notNull().default("teknisi"),
    name: text("name").notNull(),
    image: text("image"), // Profile photo URL (optional)
    isActive: integer("is_active", { mode: "boolean" }).default(true),
    createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
});

// ============================================
// MASTER DATA
// ============================================

export const categories = sqliteTable("categories", {
    id: text("id").primaryKey(), // UUID
    name: text("name").notNull(),
    description: text("description"),
    createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
});

export const suppliers = sqliteTable("suppliers", {
    id: text("id").primaryKey(), // SUP-XXX
    name: text("name").notNull(),
    contact: text("contact"),
    phone: text("phone"),
    address: text("address"),
    image: text("image"), // Supplier logo (optional)
    createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
});

export const members = sqliteTable("members", {
    id: text("id").primaryKey(), // MBR-XXX
    name: text("name").notNull(),
    phone: text("phone").notNull().unique(),
    email: text("email"),
    discountPercent: integer("discount_percent").default(0),
    points: integer("points").default(0),
    debt: integer("debt").default(0),
    creditLimit: integer("credit_limit").default(0),
    image: text("image"),
    createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
});

// ============================================
// INVENTORY
// ============================================

export const products = sqliteTable("products", {
    id: text("id").primaryKey(), // PRD-XXX
    code: text("code").unique(), // Universal Code (SKU/Barcode)
    name: text("name").notNull(),
    categoryId: text("category_id").references(() => categories.id),
    image: text("image"), // Product photo (optional)
    stock: integer("stock").notNull().default(0),
    minStock: integer("min_stock").default(5),
    createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
});

export const productBatches = sqliteTable("product_batches", {
    id: text("id").primaryKey(), // B-XXX
    productId: text("product_id").notNull().references(() => products.id),
    supplierId: text("supplier_id").references(() => suppliers.id),
    variant: text("variant"), // Free-text: Original, OEM, Copy
    supplierName: text("supplier_name"), // Snapshot for display
    buyPrice: integer("buy_price").notNull(),
    sellPrice: integer("sell_price").notNull(),
    initialStock: integer("initial_stock").notNull(),
    currentStock: integer("current_stock").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
    updatedAt: integer("updated_at", { mode: "timestamp" }),
});

// ============================================
// PURCHASES (Stock In)
// ============================================

export const purchases = sqliteTable("purchases", {
    id: text("id").primaryKey(), // PO-XXX
    supplierId: text("supplier_id").notNull().references(() => suppliers.id),
    userId: text("user_id").references(() => users.id), // Who created
    totalAmount: integer("total_amount").notNull(),
    notes: text("notes"),
    date: integer("date", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
});

export const purchaseItems = sqliteTable("purchase_items", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    purchaseId: text("purchase_id").notNull().references(() => purchases.id),
    productId: text("product_id").notNull().references(() => products.id),
    variant: text("variant"),
    qtyOrdered: integer("qty_ordered").notNull(),
    qtyReceived: integer("qty_received").notNull(),
    buyPrice: integer("buy_price").notNull(),
    sellPrice: integer("sell_price").notNull(),
    batchId: text("batch_id").references(() => productBatches.id),
    createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
});

// ============================================
// SALES (Stock Out)
// ============================================

export const sales = sqliteTable("sales", {
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
    createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
});

export const saleItems = sqliteTable("sale_items", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    saleId: text("sale_id").notNull().references(() => sales.id),
    productId: text("product_id").notNull().references(() => products.id),
    batchId: text("batch_id").notNull().references(() => productBatches.id),
    variant: text("variant"), // Snapshot
    qty: integer("qty").notNull(),
    price: integer("price").notNull(),
    subtotal: integer("subtotal").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
});

// ============================================
// SERVICE
// ============================================

export const services = sqliteTable("services", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    no: text("no").notNull().unique(), // SRV-YYYY-XXX

    customer: text("customer", { mode: "json" }).notNull().$type<{ name: string; phone: string; address?: string }>(),
    device: text("device", { mode: "json" }).notNull().$type<{ brand: string; model: string; imei?: string; equipment?: string }>(),

    complaint: text("complaint").notNull(),
    diagnosis: text("diagnosis"),
    notes: text("notes"),

    status: text("status", { enum: ["antrian", "dicek", "konfirmasi", "dikerjakan", "selesai", "diambil", "batal"] }).default("antrian"),

    technicianId: text("technician_id").references(() => users.id),
    createdBy: text("created_by").references(() => users.id), // Who created ticket

    costEstimate: integer("cost_estimate"),
    actualCost: integer("actual_cost"),

    dateIn: integer("date_in", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
    dateOut: integer("date_out", { mode: "timestamp" }),
    estimatedCompletionDate: integer("estimated_completion_date", { mode: "timestamp" }),
});

// ============================================
// ACTIVITY LOGS & NOTIFICATIONS
// ============================================

export const activityLogs = sqliteTable("activity_logs", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id").notNull().references(() => users.id),
    action: text("action", { enum: ["CREATE", "UPDATE", "DELETE", "ASSIGN", "STATUS_CHANGE"] }).notNull(),
    entityType: text("entity_type").notNull(), // service, sale, purchase, product
    entityId: text("entity_id").notNull(),
    oldValue: text("old_value", { mode: "json" }),
    newValue: text("new_value", { mode: "json" }),
    description: text("description"),
    createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
});

export const notifications = sqliteTable("notifications", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id").notNull().references(() => users.id),
    type: text("type", { enum: ["low_stock", "service_update", "new_assignment", "sale_complete", "purchase_complete"] }).notNull(),
    title: text("title").notNull(),
    message: text("message").notNull(),
    entityType: text("entity_type"), // service, product, sale
    entityId: text("entity_id"),
    isRead: integer("is_read", { mode: "boolean" }).default(false),
    createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
});

// ============================================
// SETTINGS
// ============================================

export const settings = sqliteTable("settings", {
    key: text("key").primaryKey(),
    value: text("value", { mode: "json" }).notNull(),
});

// ============================================
// RELATIONS
// ============================================

export const categoriesRelations = relations(categories, ({ many }) => ({
    products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
    category: one(categories, {
        fields: [products.categoryId],
        references: [categories.id],
    }),
    batches: many(productBatches),
    purchaseItems: many(purchaseItems),
    saleItems: many(saleItems),
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

export const paymentMethods = sqliteTable("payment_methods", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    type: text("type", { enum: ["cash", "transfer", "qris", "ewallet", "custom"] }).notNull(),
    icon: text("icon").notNull().default("💳"),
    enabled: integer("enabled", { mode: "boolean" }).default(true),
    createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
});

export const paymentVariants = sqliteTable("payment_variants", {
    id: text("id").primaryKey(),
    methodId: text("method_id").notNull().references(() => paymentMethods.id),
    name: text("name").notNull(),
    accountNumber: text("account_number"),
    accountHolder: text("account_holder"),
    enabled: integer("enabled", { mode: "boolean" }).default(true),
    createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
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

export const salePayments = sqliteTable("sale_payments", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    saleId: text("sale_id").notNull().references(() => sales.id),
    amount: integer("amount").notNull(),
    method: text("method").notNull(), // Snapshot name: "Transfer Bank", "Cash", etc.
    methodId: text("method_id").references(() => paymentMethods.id), // FK to payment_methods
    variantName: text("variant_name"), // Snapshot: "BCA - 1234567890"
    variantId: text("variant_id").references(() => paymentVariants.id), // FK to payment_variants
    reference: text("reference"), // Transfer ref, etc.
    proofImage: text("proof_image"), // Payment proof image
    createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
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

export const usersRelations = relations(users, ({ many }) => ({
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

export const purchaseReturns = sqliteTable("purchase_returns", {
    id: text("id").primaryKey(), // RET-XXX
    supplierId: text("supplier_id").notNull().references(() => suppliers.id),
    userId: text("user_id").notNull().references(() => users.id),
    date: integer("date", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
    notes: text("notes"),
    createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
});

export const purchaseReturnItems = sqliteTable("purchase_return_items", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    returnId: text("return_id").notNull().references(() => purchaseReturns.id),
    productId: text("product_id").notNull().references(() => products.id),
    batchId: text("batch_id").notNull().references(() => productBatches.id),
    qty: integer("qty").notNull(),
    reason: text("reason"),
    createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
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

export const defectiveItems = sqliteTable("defective_items", {
    id: text("id").primaryKey(), // DEF-XXX
    productId: text("product_id").notNull().references(() => products.id),
    batchId: text("batch_id").notNull().references(() => productBatches.id),
    supplierId: text("supplier_id").notNull().references(() => suppliers.id),
    qty: integer("qty").notNull(),
    source: text("source").notNull(), // manual, sales_return, service_return
    sourceRefId: text("source_ref_id"),
    reason: text("reason"),
    status: text("status").notNull().default("pending"), // pending, processed
    createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
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
