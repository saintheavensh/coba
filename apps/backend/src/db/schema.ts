import { relations, sql } from "drizzle-orm";
import { text, integer, boolean, timestamp, pgTable, json, foreignKey, primaryKey, unique } from "drizzle-orm/pg-core";
import { randomUUID } from "crypto";

// Helper for default UUID
function uuid() {
    return text("id").primaryKey().$defaultFn(() => randomUUID());
}

// Helper for timestamps
function timestamps() {
    return {
        createdAt: timestamp("created_at").defaultNow(),
        updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
        deletedAt: timestamp("deleted_at"),
    };
}

// Basic timestamps (created only)
function createdTimestamp() {
    return {
        createdAt: timestamp("created_at").defaultNow(),
    };
}

// ============================================
// USERS & AUTH
// ============================================

export const roles = pgTable("roles", {
    id: text("id").primaryKey(), // "admin", "teknisi", "kasir" (Keep manual ID for roles)
    name: text("name").notNull(),
    permissions: json("permissions").$type<string[]>().notNull().default([]),
    createdAt: timestamp("created_at").defaultNow(),
});

export const users = pgTable("users", {
    id: text("id").primaryKey(), // UUID (Keep existing logic if assumes external ID, or default)
    // Existing schema didn't have auto-gen for users, but let's allow it if needed, or keep as is.
    // Given the refactor plan says "users... will remain text", we keep it. 
    // But we add timestamps.
    username: text("username").notNull().unique(),
    password: text("password").notNull(),
    role: text("role").notNull().references(() => roles.id).default("teknisi"),
    name: text("name").notNull(),
    image: text("image"),
    commissionConfig: json("commission_config"),
    isActive: boolean("is_active").default(true),
    ...timestamps(),
});

export const userRoles = pgTable("user_roles", {
    userId: text("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
    roleId: text("role_id").notNull().references(() => roles.id, { onDelete: 'cascade' }),
}, (table) => ({
    pk: primaryKey({ columns: [table.userId, table.roleId] }),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
    user: one(users, {
        fields: [userRoles.userId],
        references: [users.id],
    }),
    role: one(roles, {
        fields: [userRoles.roleId],
        references: [roles.id],
    }),
}));

// ============================================
// MASTER DATA
// ============================================

export const categories = pgTable("categories", {
    id: text("id").primaryKey(), // UUID (Keep as is, but add timestamps)
    name: text("name").notNull(),
    description: text("description"),
    parentId: text("parent_id"),
    ...timestamps(),
}, (table) => ({
    parentReference: foreignKey({
        columns: [table.parentId],
        foreignColumns: [table.id],
        name: "categories_parent_id_fkey"
    })
}));

export const categoryVariants = pgTable("category_variants", {
    id: uuid(), // CHANGED: serial -> uuid
    categoryId: text("category_id").notNull().references(() => categories.id, { onDelete: 'cascade' }),
    name: text("name").notNull(),
    supplierId: text("supplier_id").references(() => suppliers.id, { onDelete: 'cascade' }),
    createdAt: timestamp("created_at").defaultNow(),
});

export const suppliers = pgTable("suppliers", {
    id: text("id").primaryKey(), // SUP-XXX (Keep as is)
    name: text("name").notNull(),
    contact: text("contact"),
    phone: text("phone"),
    address: text("address"),
    image: text("image"),
    ...timestamps(), // Added timestamps + deletedAt
});

export const members = pgTable("members", {
    id: text("id").primaryKey(), // MBR-XXX (Keep as is)
    name: text("name").notNull(),
    phone: text("phone").notNull().unique(),
    email: text("email"),
    discountPercent: integer("discount_percent").default(0),
    points: integer("points").default(0),
    debt: integer("debt").default(0),
    creditLimit: integer("credit_limit").default(0),
    image: text("image"),
    ...timestamps(), // Added timestamps + deletedAt
});

export const supplierCategories = pgTable("supplier_categories", {
    id: uuid(), // CHANGED: serial -> uuid
    supplierId: text("supplier_id").notNull().references(() => suppliers.id, { onDelete: 'cascade' }),
    categoryId: text("category_id").notNull().references(() => categories.id, { onDelete: 'cascade' }),
}, (t) => ({
    unq: unique("sup_cat_unique").on(t.supplierId, t.categoryId),
}));

// ============================================
// INVENTORY
// ============================================

export const products = pgTable("products", {
    id: text("id").primaryKey(), // PRD-XXX (Keep)
    code: text("code").unique(),
    name: text("name").notNull(),
    categoryId: text("category_id").references(() => categories.id),
    image: text("image"),
    stock: integer("stock").notNull().default(0),
    minStock: integer("min_stock").default(5),
    ...timestamps(), // Added timestamps + deletedAt
});

export const productVariants = pgTable("product_variants", {
    id: text("id").primaryKey(), // VAR-XXX (Keep)
    productId: text("product_id").notNull().references(() => products.id),
    name: text("name").notNull(),
    image: text("image"),
    sku: text("sku"),
    defaultPrice: integer("default_price"),
    ...timestamps(), // Added timestamps + deletedAt
});

export const productBatches = pgTable("product_batches", {
    id: text("id").primaryKey(), // B-XXX (Keep)
    productId: text("product_id").notNull().references(() => products.id),
    variantId: text("variant_id").references(() => productVariants.id),
    supplierId: text("supplier_id").references(() => suppliers.id),

    supplierName: text("supplier_name"),
    buyPrice: integer("buy_price").notNull(),
    sellPrice: integer("sell_price").notNull(),
    initialStock: integer("initial_stock").notNull(),
    currentStock: integer("current_stock").notNull(),
    ...timestamps(), // Added timestamps + deletedAt
});

// ============================================
// PURCHASES (Stock In)
// ============================================

export const purchases = pgTable("purchases", {
    id: text("id").primaryKey(), // PO-XXX (Keep)
    supplierId: text("supplier_id").notNull().references(() => suppliers.id),
    userId: text("user_id").references(() => users.id),
    totalAmount: integer("total_amount").notNull(),
    referenceNumber: text("reference_number"),
    notes: text("notes"),
    date: timestamp("date").defaultNow(),

    // Procurement Workflow Fields
    status: text("status", { enum: ["DRAFT", "ORDERED", "RECEIVED", "VERIFIED", "CANCELLED"] }).default("ORDERED"),
    receivedBy: text("received_by").references(() => users.id),
    receivedAt: timestamp("received_at"),
    verifiedAt: timestamp("verified_at"),
    verifiedBy: text("verified_by").references(() => users.id),

    cancelledAt: timestamp("cancelled_at"),
    cancelledBy: text("cancelled_by").references(() => users.id),

    shippingFee: integer("shipping_fee").default(0),
    shippingExpenseAccountId: text("shipping_expense_account_id").references(() => accounts.id),
    discountAmount: integer("discount_amount").default(0),
    paymentDueDate: timestamp("payment_due_date"),
});

export const purchaseItems = pgTable("purchase_items", {
    id: uuid(), // CHANGED: serial -> uuid
    purchaseId: text("purchase_id").notNull().references(() => purchases.id),
    productId: text("product_id").notNull().references(() => products.id),
    variant: text("variant"),
    qtyOrdered: integer("qty_ordered").notNull(),
    qtyReceived: integer("qty_received").notNull().default(0),
    buyPrice: integer("buy_price").notNull().default(0),
    sellPrice: integer("sell_price").notNull().default(0),

    // Pricing Intelligence
    targetSellPrice: integer("target_sell_price"),
    estimatedBuyPrice: integer("estimated_buy_price"),

    batchId: text("batch_id").references(() => productBatches.id),
    createdAt: timestamp("created_at").defaultNow(),
});

// ============================================
// SALES (Stock Out)
// ============================================

export const sales = pgTable("sales", {
    id: text("id").primaryKey(), // SAL-XXX (Keep)
    memberId: text("member_id").references(() => members.id),
    customerName: text("customer_name"),
    totalAmount: integer("total_amount").notNull(),
    discountAmount: integer("discount_amount").default(0),
    paymentMethod: text("payment_method", { enum: ["cash", "transfer", "qris", "mixed"] }).notNull(),
    paymentStatus: text("payment_status", { enum: ["paid", "partial", "unpaid"] }).notNull().default("paid"),
    userId: text("user_id").notNull().references(() => users.id),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow(),
});

export const saleItems = pgTable("sale_items", {
    id: uuid(), // CHANGED: serial -> uuid
    saleId: text("sale_id").notNull().references(() => sales.id),
    productId: text("product_id").notNull().references(() => products.id),
    batchId: text("batch_id").notNull().references(() => productBatches.id),
    variant: text("variant"),
    qty: integer("qty").notNull(),
    price: integer("price").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
});

// ============================================
// DEVICES
// ============================================

export const devices = pgTable("devices", {
    id: text("id").primaryKey(), // DEV-XXX or UUID (Keep)
    brand: text("brand").notNull(),
    series: text("series"),
    model: text("model").notNull(),
    code: text("code"),
    image: text("image"),
    colors: json("colors").$type<string[]>(),
    specs: text("specs"),
    chipset: text("chipset"),
    specifications: json("specifications").$type<Record<string, any>>(),
    ...timestamps(), // Added timestamps + deletedAt
});

export const brands = pgTable("brands", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    logo: text("logo"),
    createdAt: timestamp("created_at").defaultNow(),
});

export const productDeviceCompatibility = pgTable("product_device_compatibility", {
    productId: text("product_id").notNull().references(() => products.id, { onDelete: 'cascade' }),
    deviceId: text("device_id").notNull().references(() => devices.id, { onDelete: 'cascade' }),
}, (t) => ({
    pk: primaryKey({ columns: [t.productId, t.deviceId] }),
}));

// ============================================
// SERVICE
// ============================================

export const services = pgTable("services", {
    // CHANGED: id is now UUID, 'no' is the readable reference
    id: uuid(),
    no: text("no").notNull().unique(), // SRV-YYYY-XXX

    customer: json("customer").notNull().$type<{ name: string; phone: string; address?: string }>(),
    device: json("device").notNull().$type<{ brand: string; model: string; imei?: string; equipment?: string }>(),

    complaint: text("complaint").notNull(),
    diagnosis: text("diagnosis"),
    notes: text("notes"),

    status: text("status", { enum: ["antrian", "dicek", "konfirmasi", "dikerjakan", "re-konfirmasi", "selesai", "diambil", "batal"] }).default("antrian"),

    technicianId: text("technician_id").references(() => users.id),
    createdBy: text("created_by").references(() => users.id),

    costEstimate: integer("cost_estimate"),
    actualCost: integer("actual_cost"),

    dateIn: timestamp("date_in").defaultNow(),
    dateOut: timestamp("date_out"),
    estimatedCompletionDate: timestamp("estimated_completion_date"),
    parts: json("parts"),
    qc: json("qc"),
    reconfirmationCount: integer("reconfirmation_count").default(0),

    warranty: text("warranty"),
    warrantyExpiryDate: timestamp("warranty_expiry_date"),
    priority: text("priority", { enum: ["standard", "wait"] }).default("standard"),
    isDirectComplete: boolean("is_direct_complete").default(false),

    ...timestamps(), // Added timestamps + deletedAt
});

// ============================================
// ACTIVITY LOGS & NOTIFICATIONS
// ============================================

export const activityLogs = pgTable("activity_logs", {
    id: uuid(), // CHANGED: serial -> uuid
    userId: text("user_id").notNull().references(() => users.id),
    action: text("action", { enum: ["CREATE", "UPDATE", "DELETE", "ASSIGN", "STATUS_CHANGE", "LOGIN", "LOGOUT", "EXPORT"] }).notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    oldValue: json("old_value"),
    newValue: json("new_value"),
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow(),
});

export const notifications = pgTable("notifications", {
    id: uuid(), // CHANGED: serial -> uuid
    userId: text("user_id").notNull().references(() => users.id),
    type: text("type", { enum: ["low_stock", "service_update", "new_assignment", "sale_complete", "purchase_complete", "po_action_required", "po_discrepancy", "spend_alert"] }).notNull(),
    title: text("title").notNull(),
    message: text("message").notNull(),
    entityType: text("entity_type"),
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
// RELATIONS (Consolidated imports needed)
// Relations definitions at the bottom...
// ============================================

// ... (Will append relations below)

// ============================================
// PURCHASE RETURNS
// ============================================

export const purchaseReturns = pgTable("purchase_returns", {
    id: text("id").primaryKey(), // RET-XXX (Keep)
    supplierId: text("supplier_id").notNull().references(() => suppliers.id),
    userId: text("user_id").notNull().references(() => users.id),
    date: timestamp("date").defaultNow(),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow(),
});

export const purchaseReturnItems = pgTable("purchase_return_items", {
    id: uuid(), // CHANGED: serial -> uuid
    returnId: text("return_id").notNull().references(() => purchaseReturns.id),
    productId: text("product_id").notNull().references(() => products.id),
    batchId: text("batch_id").notNull().references(() => productBatches.id),
    qty: integer("qty").notNull(),
    reason: text("reason"),
    createdAt: timestamp("created_at").defaultNow(),
});

// ============================================
// DEFECTIVE ITEMS
// ============================================

export const defectiveItems = pgTable("defective_items", {
    id: text("id").primaryKey(), // DEF-XXX (Keep)
    productId: text("product_id").notNull().references(() => products.id),
    batchId: text("batch_id").notNull().references(() => productBatches.id),
    supplierId: text("supplier_id").notNull().references(() => suppliers.id),
    qty: integer("qty").notNull(),
    source: text("source").notNull(),
    sourceRefId: text("source_ref_id"),
    reason: text("reason"),
    status: text("status").notNull().default("pending"),
    createdAt: timestamp("created_at").defaultNow(),
});

// ============================================
// OPERATIONAL COSTS
// ============================================

export const operationalCosts = pgTable("operational_costs", {
    id: uuid(), // CHANGED: serial -> uuid
    category: text("category").notNull(),
    amount: integer("amount").notNull(),
    date: timestamp("date").defaultNow(),
    description: text("description"),
    status: text("status", { enum: ["paid", "pending"] }).default("paid"),
    dueDate: timestamp("due_date"),
    paidAt: timestamp("paid_at"),
    userId: text("user_id").references(() => users.id),
    createdAt: timestamp("created_at").defaultNow(),
});

// ============================================
// STOCK OPNAME
// ============================================

export const stockOpnameSessions = pgTable("stock_opname_sessions", {
    id: text("id").primaryKey(),
    status: text("status", { enum: ["draft", "completed", "cancelled"] }).default("draft"),
    userId: text("user_id").notNull().references(() => users.id),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow(),
    completedAt: timestamp("completed_at"),
});

export const stockOpnameItems = pgTable("stock_opname_items", {
    id: uuid(), // CHANGED: serial -> uuid
    sessionId: text("session_id").notNull().references(() => stockOpnameSessions.id, { onDelete: 'cascade' }),
    productId: text("product_id").notNull().references(() => products.id),
    variantName: text("variant_name"),
    batchId: text("batch_id").references(() => productBatches.id),
    systemStock: integer("system_stock").notNull(),
    physicalStock: integer("physical_stock"),
    adjustmentReason: text("adjustment_reason"),
});

export const serviceTools = pgTable("service_tools", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    brand: text("brand"),
    qty: integer("qty").notNull().default(1),
    condition: text("condition", { enum: ["good", "damaged", "lost"] }).default("good"),
    purchaseDate: timestamp("purchase_date"),
    price: integer("price"),
    notes: text("notes"),
    userId: text("user_id").references(() => users.id),
    createdAt: timestamp("created_at").defaultNow(),
});

export const serviceToolRequests = pgTable("service_tool_requests", {
    id: uuid(),
    userId: text("user_id").notNull().references(() => users.id),
    toolName: text("tool_name").notNull(),
    justification: text("justification").notNull(),
    status: text("status", { enum: ["pending", "approved", "rejected"] }).default("pending"),
    createdAt: timestamp("created_at").defaultNow(),
});

// ============================================
// ACCOUNTING - CHART OF ACCOUNTS
// ============================================

export const accountTypes = pgTable("account_types", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    normalBalance: text("normal_balance", { enum: ["debit", "credit"] }).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
});

export const accounts = pgTable("accounts", {
    id: text("id").primaryKey(), // "1-1001" (Keep)
    code: text("code").notNull().unique(),
    name: text("name").notNull(),
    typeId: text("type_id").notNull().references(() => accountTypes.id),
    parentId: text("parent_id"),
    description: text("description"),
    isActive: boolean("is_active").default(true),
    isSystem: boolean("is_system").default(false),
    balance: integer("balance").notNull().default(0),
    ...timestamps(), // Added timestamps + deletedAt
}, (table) => ({
    parentReference: foreignKey({
        columns: [table.parentId],
        foreignColumns: [table.id],
        name: "accounts_parent_id_fkey"
    })
}));

// ============================================
// ACCOUNTING - JOURNAL ENTRIES
// ============================================

export const journals = pgTable("journals", {
    id: text("id").primaryKey(), // "JRN-..." (Keep)
    date: timestamp("date").notNull().defaultNow(),
    description: text("description").notNull(),
    referenceType: text("reference_type"),
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
    id: uuid(), // CHANGED: serial -> uuid
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
    id: text("id").primaryKey(),
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
    ...timestamps(), // Added timestamps + deletedAt
});

export const assetDepreciationLogs = pgTable("asset_depreciation_logs", {
    id: uuid(), // CHANGED: serial -> uuid
    assetId: text("asset_id").notNull().references(() => assets.id, { onDelete: 'cascade' }),
    period: text("period").notNull(),
    amount: integer("amount").notNull(),
    valueAfter: integer("value_after").notNull(),
    journalId: text("journal_id").references(() => journals.id),
    createdAt: timestamp("created_at").defaultNow(),
});

// ============================================
// ACCOUNTING - CASH REGISTER
// ============================================

export const cashRegisters = pgTable("cash_registers", {
    id: text("id").primaryKey(),
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
    id: uuid(), // CHANGED: serial -> uuid
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
    id: uuid(), // CHANGED: serial -> uuid
    month: text("month").notNull().unique(),
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
    id: uuid(), // CHANGED: serial -> uuid
    purchaseId: text("purchase_id").notNull().references(() => purchases.id),
    supplierId: text("supplier_id").notNull().references(() => suppliers.id),
    amount: integer("amount").notNull(),
    method: text("method").notNull(),
    accountId: text("account_id").references(() => accounts.id),
    reference: text("reference"),
    proofImage: text("proof_image"),
    date: timestamp("date").notNull().defaultNow(),
    journalId: text("journal_id").references(() => journals.id),
    createdBy: text("created_by").references(() => users.id),
    createdAt: timestamp("created_at").defaultNow(),
});

// ============================================
// ACCOUNTING - PERIOD CLOSING
// ============================================

export const periodLocks = pgTable("period_locks", {
    id: uuid(), // CHANGED: serial -> uuid
    period: text("period").notNull().unique(),
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
    id: uuid(), // CHANGED: serial -> uuid
    technicianId: text("technician_id").notNull().references(() => users.id),
    period: text("period").notNull(),
    serviceIds: json("service_ids").$type<string[]>().notNull().default([]),
    // Wait, service_ids references ID. If service.id is now UUID, this should be string[].
    // Updating type definition.
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
    id: uuid(), // CHANGED: serial -> uuid
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
// PAYMENT METHODS
// ============================================

export const paymentMethods = pgTable("payment_methods", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    type: text("type", { enum: ["cash", "transfer", "qris", "ewallet", "custom"] }).notNull(),
    icon: text("icon").notNull().default("💳"),
    accountId: text("account_id").references(() => accounts.id),
    feeConfig: json("fee_config").$type<{ enabled: boolean; type: "percent" | "fixed"; value: number }>(),
    enabled: boolean("enabled").default(true),
    ...timestamps(), // Added timestamps + deletedAt
});

export const paymentVariants = pgTable("payment_variants", {
    id: text("id").primaryKey(), // Keep as Text/UUID
    methodId: text("method_id").notNull().references(() => paymentMethods.id),
    name: text("name").notNull(),
    accountNumber: text("account_number"),
    accountHolder: text("account_holder"),
    accountId: text("account_id").references(() => accounts.id),
    enabled: boolean("enabled").default(true),
    created_at: timestamp("created_at").defaultNow(),
});

export const salePayments = pgTable("sale_payments", {
    id: uuid(), // CHANGED: serial -> uuid
    saleId: text("sale_id").notNull().references(() => sales.id),
    amount: integer("amount").notNull(),
    method: text("method").notNull(),
    methodId: text("method_id").references(() => paymentMethods.id),
    variantName: text("variant_name"),
    variantId: text("variant_id").references(() => paymentVariants.id),
    reference: text("reference"),
    proofImage: text("proof_image"),
    createdAt: timestamp("created_at").defaultNow(),
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
    variantTemplates: many(categoryVariants),
    suppliers: many(supplierCategories),
}));

export const supplierCategoriesRelations = relations(supplierCategories, ({ one }) => ({
    supplier: one(suppliers, {
        fields: [supplierCategories.supplierId],
        references: [suppliers.id],
    }),
    category: one(categories, {
        fields: [supplierCategories.categoryId],
        references: [categories.id],
    }),
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
    categories: many(supplierCategories),
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
    payments: many(purchasePayments),
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
    users: many(userRoles),
}));

export const usersRelations = relations(users, ({ many, one }) => ({
    roles: many(userRoles),
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

export const operationalCostsRelations = relations(operationalCosts, ({ one }) => ({
    user: one(users, {
        fields: [operationalCosts.userId],
        references: [users.id],
    }),
}));

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

export const serviceToolsRelations = relations(serviceTools, ({ one }) => ({
    technician: one(users, {
        fields: [serviceTools.userId],
        references: [users.id],
    }),
}));

export const serviceToolRequestsRelations = relations(serviceToolRequests, ({ one }) => ({
    requester: one(users, {
        fields: [serviceToolRequests.userId],
        references: [users.id],
    }),
}));
