import { db } from "../../../../db";
import { brands } from "../../../../db/schema";
import { eq, desc, ilike } from "drizzle-orm";
import { DBContext } from "../../../../shared/types/db-context";
import { IBrandRepository, Brand, CreateBrandData, UpdateBrandData } from "../../domain";

export class BrandRepositoryAdapter implements IBrandRepository {
    async findAll(dbOrTx: any = db): Promise<Brand[]> {
        return await dbOrTx.select().from(brands).orderBy(desc(brands.createdAt));
    }

    async findById(id: string, dbOrTx: any = db): Promise<Brand | null> {
        const results = await dbOrTx
            .select()
            .from(brands)
            .where(eq(brands.id, id));
        return results[0] || null;
    }

    async findByName(name: string, dbOrTx: any = db): Promise<Brand | null> {
        const results = await dbOrTx
            .select()
            .from(brands)
            .where(ilike(brands.name, name));
        return results[0] || null;
    }

    async create(data: CreateBrandData, dbOrTx: any = db): Promise<Brand[]> {
        return await dbOrTx.insert(brands).values(data).returning();
    }

    async update(id: string, data: UpdateBrandData, dbOrTx: any = db): Promise<Brand[]> {
        return await dbOrTx
            .update(brands)
            .set(data)
            .where(eq(brands.id, id))
            .returning();
    }

    async delete(id: string, dbOrTx: any = db): Promise<Brand[]> {
        return await dbOrTx.delete(brands).where(eq(brands.id, id)).returning();
    }
}
