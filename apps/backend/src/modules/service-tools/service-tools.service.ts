import { db } from "../../db";
import { serviceTools } from "../../db/schema";
import { eq, desc } from "drizzle-orm";

export class ServiceToolsService {
    async getAll() {
        return await db.select().from(serviceTools).orderBy(desc(serviceTools.createdAt));
    }

    async create(data: any) {
        // Generate ID
        const last = await db.select().from(serviceTools).orderBy(desc(serviceTools.id)).limit(1);
        let nextId = "TOOL-001";
        if (last.length > 0) {
            const parts = last[0].id.split("-");
            if (parts.length > 1) {
                const num = parseInt(parts[1]);
                if (!isNaN(num)) {
                    nextId = `TOOL-${String(num + 1).padStart(3, "0")}`;
                }
            }
        }

        const newData = {
            id: nextId,
            name: data.name,
            brand: data.brand,
            qty: Number(data.qty) || 1,
            condition: data.condition || "good",
            purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
            price: Number(data.price) || 0,
            notes: data.notes
        };

        await db.insert(serviceTools).values(newData);
        return newData;
    }

    async update(id: string, data: any) {
        const updateData: any = {};
        if (data.name) updateData.name = data.name;
        if (data.brand) updateData.brand = data.brand;
        if (data.qty !== undefined) updateData.qty = Number(data.qty);
        if (data.condition) updateData.condition = data.condition;
        if (data.purchaseDate) updateData.purchaseDate = new Date(data.purchaseDate);
        if (data.price !== undefined) updateData.price = Number(data.price);
        if (data.notes) updateData.notes = data.notes;

        await db.update(serviceTools).set(updateData).where(eq(serviceTools.id, id));
        return { message: "Updated" };
    }

    async delete(id: string) {
        await db.delete(serviceTools).where(eq(serviceTools.id, id));
        return { message: "Deleted" };
    }
}
