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

export const productBatches = pgTable("product_batches", {
    id: text("id").primaryKey(), // B-XXX
    productId: text("product_id").notNull().references(() => products.id),
    supplierId: text("supplier_id").references(() => suppliers.id),
    variant: text("variant"), // Free-text: Original, OEM, Copy
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
    model: text("model").notNull(), // Galaxy S25, iPhone 16
    code: text("code"), // SM-S921B (Machine Code)
    image: text("image"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at"),
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
});

// ============================================
// ACTIVITY LOGS & NOTIFICATIONS
// ============================================

export const activityLogs = pgTable("activity_logs", {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id),
    action: text("action", { enum: ["CREATE", "UPDATE", "DELETE", "ASSIGN", "STATUS_CHANGE"] }).notNull(),
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
    })
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
