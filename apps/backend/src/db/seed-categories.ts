import { db } from "./index";
import { categories } from "./schema";

async function seed() {
    console.log("Seeding categories...");
    try {
        await db.insert(categories).values([
            { id: "CAT-001", name: "Handphone", description: "Smartphone Android & iOS" },
            { id: "CAT-002", name: "Laptop", description: "Notebook & Macbook" },
            { id: "CAT-003", name: "Aksesoris", description: "Casing, Charger, Kabel" },
            { id: "CAT-004", name: "Sparepart", description: "LCD, Baterai, Mesin" },
            { id: "CAT-005", name: "Elektronik", description: "TV, Speaker, dll" },
        ]);
        console.log("Categories seeded!");
    } catch (e) {
        console.error("Error seeding:", e);
    }
}

seed();
