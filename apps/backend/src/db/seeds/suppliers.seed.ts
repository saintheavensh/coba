/**
 * Suppliers Seed
 */
import { db } from "../index";
import { suppliers } from "../schema";
import { SUPPLIER_IDS } from "./helpers";

export async function seedSuppliers() {
    console.log("Creating suppliers...");

    await db.insert(suppliers).values([
        {
            id: SUPPLIER_IDS.global,
            name: "PT Global Sparepart",
            phone: "021-5551234",
            address: "Ruko Mangga Dua Blok C/12, Jakarta",
        },
        {
            id: SUPPLIER_IDS.lokal,
            name: "UD Jaya Elektronik",
            phone: "0812-9998877",
            address: "Pasar Glodok Lt.2 No.45",
        }
    ]);

    console.log("✅ Created 2 suppliers.");
}
