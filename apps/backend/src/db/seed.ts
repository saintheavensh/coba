/**
 * Main Seed File
 * Orchestrates the execution of all modular seeds
 */
import { db } from "./index";
import {
    users, suppliers, categories, products, productBatches, members,
    purchases, purchaseItems, sales, saleItems, salePayments,
    services, activityLogs, notifications, paymentMethods, paymentVariants,
    roles, devices, brands, productDeviceCompatibility, purchaseReturns,
    purchaseReturnItems, defectiveItems, categoryVariants, productVariants,
    settings, operationalCosts, stockOpnameItems, stockOpnameSessions, serviceTools,
    // Accounting tables
    accountTypes, accounts, journals, journalLines, assets, assetDepreciationLogs,
    cashRegisters, cashRegisterTransactions, revenueTargets, purchasePayments,
    periodLocks, commissionPayments, auditLogs
} from "./schema";

import { seedUsers, seedSettings } from "./seeds/users.seed";
import { seedSuppliers } from "./seeds/suppliers.seed";
import { seedProducts } from "./seeds/products.seed";
import { seedPurchases } from "./seeds/purchases.seed";
import { seedSales } from "./seeds/sales.seed";
import { seedServices } from "./seeds/services.seed";
import { seedAccounting } from "./seeds/accounting.seed";

async function main() {
    console.log("🌱 Starting Comprehensive Database Seed...");

    console.log("⚠️ Deleting existing data...");

    // Delete in reverse order of dependencies
    await db.delete(activityLogs);
    await db.delete(notifications);
    await db.delete(stockOpnameItems);
    await db.delete(stockOpnameSessions);
    await db.delete(serviceTools); // Assets
    await db.delete(salePayments);
    await db.delete(saleItems);
    await db.delete(sales);
    await db.delete(purchaseItems);
    await db.delete(purchases);
    await db.delete(purchaseReturnItems);
    await db.delete(purchaseReturns);
    await db.delete(defectiveItems);
    await db.delete(services);
    await db.delete(productDeviceCompatibility);
    await db.delete(productBatches);
    await db.delete(productVariants);
    await db.delete(products);
    await db.delete(categoryVariants);
    await db.delete(categories);
    await db.delete(members);
    await db.delete(suppliers);
    await db.delete(paymentVariants);
    await db.delete(paymentMethods);
    await db.delete(devices);
    await db.delete(brands);
    await db.delete(operationalCosts);
    await db.delete(settings);
    // Accounting tables
    await db.delete(auditLogs);
    await db.delete(commissionPayments);
    await db.delete(periodLocks);
    await db.delete(purchasePayments);
    await db.delete(revenueTargets);
    await db.delete(cashRegisterTransactions);
    await db.delete(cashRegisters);
    await db.delete(assetDepreciationLogs);
    await db.delete(assets);
    await db.delete(journalLines);
    await db.delete(journals);
    await db.delete(accounts);
    await db.delete(accountTypes);

    // Core User Data (Must be last)
    await db.delete(users);
    await db.delete(roles);

    console.log("✅ Data cleared.");

    // Execute modular seeds in order
    await seedSettings();
    await seedUsers();

    const args = process.argv.slice(2);
    if (args.includes("--users-only")) {
        console.log("\n✅ Database reset complete (Users & Roles preserved). Skipping transactional data.");
        return;
    }

    // await seedSuppliers();
    // await seedProducts();
    // await seedPurchases();
    // await seedSales();
    // await seedServices();
    await seedAccounting();

    console.log("\n✅ COMPREHENSIVE DATABASE SEED COMPLETE!");
}

main().catch((e) => {
    console.error("❌ Seeding failed:");
    console.error(e);
    process.exit(1);
});
