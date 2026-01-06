import { db } from "../../db";
import { services, activityLogs } from "../../db/schema";
import { eq, desc, like } from "drizzle-orm";

export class ServiceRepository {
    async findAll(filters: any[] = []) {
        // Implement complex filter logic in Service or Repo
        // For simplicity returning all sorted
        return await db.query.services.findMany({
            orderBy: [desc(services.dateIn)],
            with: {
                technician: true
            }
        });
    }

    async findById(id: number) {
        return await db.query.services.findFirst({
            where: eq(services.id, id),
            with: {
                technician: true
            }
        });
    }

    async findLastServiceNo(prefix: string) {
        return await db.query.services.findFirst({
            where: like(services.no, `${prefix}%`),
            orderBy: [desc(services.id)]
        });
    }
}
