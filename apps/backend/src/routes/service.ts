import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { db } from "../db";
import { services, activityLogs } from "../db/schema";
import { eq, desc, like, sql } from "drizzle-orm";
import { createServiceSchema, updateStatusSchema } from "@repo/shared";

const service = new Hono();

// Helper: Generate Service No (SRV-YYYYMMDD-XXX)
async function generateServiceNo() {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, ""); // 20240105
    const prefix = `SRV-${today}`;

    // Find last service today
    const lastService = await db.query.services.findFirst({
        where: like(services.no, `${prefix}%`),
        orderBy: [desc(services.id)]
    });

    let counter = 1;
    if (lastService) {
        const parts = lastService.no.split("-");
        const lastCount = parseInt(parts[2]);
        if (!isNaN(lastCount)) counter = lastCount + 1;
    }

    return `${prefix}-${String(counter).padStart(3, "0")}`;
}

// GET / - List services
service.get("/", async (c) => {
    const status = c.req.query("status");
    const technicianId = c.req.query("technicianId");

    const filters: any[] = [];
    if (status && status !== "all") {
        filters.push(eq(services.status, status as any));
    }
    if (technicianId && technicianId !== "all") {
        if (technicianId === "unassigned") {
            filters.push(sql`${services.technicianId} IS NULL`);
        } else {
            filters.push(eq(services.technicianId, technicianId));
        }
    }

    const allServices = await db.query.services.findMany({
        where: filters.length > 0 ? sql`${sql.join(filters, sql` AND `)}` : undefined,
        with: {
            technician: true
        },
        orderBy: [desc(services.dateIn)]
    });
    return c.json(allServices);
});

// GET /:id - Detail
service.get("/:id", async (c) => {
    const idParam = c.req.param("id");
    const id = parseInt(idParam);
    if (isNaN(id)) return c.json({ message: "Invalid ID" }, 400);

    const srv = await db.query.services.findFirst({
        where: eq(services.id, id),
        with: {
            technician: true
        }
    });
    if (!srv) return c.json({ message: "Not found" }, 404);
    return c.json(srv);
});

// POST / - Create Service
service.post("/", zValidator("json", createServiceSchema), async (c) => {
    const data = c.req.valid("json");
    const no = await generateServiceNo();

    await db.transaction(async (tx) => {
        // Map data to match DB schema
        await tx.insert(services).values({
            no,
            customer: data.customer,
            device: data.unit, // Map 'unit' from shared schema to 'device' column
            complaint: data.complaint,
            // JSON.stringify diagnosis because DB column might be simple text. 
            // In schema.ts: diagnosis: text("diagnosis")
            diagnosis: JSON.stringify(data.diagnosis || {}),

            // Handle costEstimate from range string or simple string
            costEstimate: 0, // Simplified for now to avoid parsing errors

            technicianId: data.technicianId || null,
            status: "antrian"
        });

        // Log
        await tx.insert(activityLogs).values({
            action: "New Service",
            description: `Service ${no} created for ${data.customer.name}`,
            timestamp: new Date()
        });
    });

    return c.json({ message: "Service created", no });
});

// PUT /:id/status - Update Status
service.put("/:id/status", zValidator("json", updateStatusSchema), async (c) => {
    const idParam = c.req.param("id");
    const id = parseInt(idParam);
    const data = c.req.valid("json");

    const srv = await db.query.services.findFirst({ where: eq(services.id, id) });
    if (!srv) return c.json({ message: "Not found" }, 404);

    await db.transaction(async (tx) => {
        await tx.update(services).set({
            status: data.status,
            notes: data.notes,
            actualCost: data.actualCost,
            dateOut: (data.status === "selesai" || data.status === "diambil") ? new Date() : undefined
        }).where(eq(services.id, id));

        await tx.insert(activityLogs).values({
            userId: data.userId,
            action: "Update Status",
            description: `Service ${srv.no} updated to ${data.status}`,
            timestamp: new Date()
        });
    });

    return c.json({ message: "Status updated" });
});

export default service;
