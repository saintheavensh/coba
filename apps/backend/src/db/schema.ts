// Export all schemas from their respective modules to maintain the central hub
// and ensure Drizzle migrations and repository imports continue to work correctly.

export * from "../modules/users/infrastructure/schema/UserSchema";
export * from "../modules/categories/infrastructure/schema/CategorySchema";
export * from "../modules/products/infrastructure/schema/ProductSchema";
export * from "../modules/inventory/infrastructure/schema/BatchSchema";
export * from "../modules/inventory/infrastructure/schema/VariantSchema";
export * from "../modules/inventory/infrastructure/schema/StockOpnameSchema";
export * from "../modules/inventory/infrastructure/schema/DefectiveItemSchema";
export * from "../modules/inventory/infrastructure/schema/GamblingSchema";
export * from "../modules/customers/infrastructure/schema/MemberSchema";
export * from "../modules/suppliers/infrastructure/schema/SupplierSchema";
export * from "../modules/sales/infrastructure/schema/SaleSchema";
export * from "../modules/purchases/infrastructure/schema/PurchaseSchema";
export * from "../modules/accounting/infrastructure/schema/AccountingSchema";
export * from "../modules/dashboard/infrastructure/schema/ActivitySchema";
export * from "../modules/devices/infrastructure/schema/DeviceSchema";
export * from "../modules/devices/infrastructure/schema/BrandSchema";
export * from "../modules/settings/infrastructure/schema/AppSettingSchema";
export * from "../modules/service/infrastructure/schema/ServiceSchema";
export * from "../modules/approvals/infrastructure/schema/ApprovalSchema";

// Operational costs and other stragglers
export { storeDeviceTable } from "../shared/infrastructure/external-api/devices/infrastructure/schema";


// Centralized Relations
export * from "./relations";
