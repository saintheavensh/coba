import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { db } from "../db";
import { services, activityLogs, users, products } from "../db/schema";
import { eq, desc, like } from "drizzle-orm";

const service = new Hono();

// Schemas
const createServiceSchema = z.object({
    customer: z.object({
        name: z.string(),
        phone: z.string(),
        address: z.string().optional()
    }),
    device: z.object({
        brand: z.string(),
        model: z.string(),
        imei: z.string().optional(),
        equipment: z.string().optional(),
        pattern: z.string().optional(), // Grid pattern string/JSON
        passcode: z.string().optional()
    }),
    complaint: z.string(),
    diagnosis: z.string().optional(),
    costEstimate: z.number().optional(),
    technicianId: z.string().optional()
});

const updateStatusSchema = z.object({
    status: z.enum(["antrian", "dicek", "konfirmasi", "dikerjakan", "selesai", "diambil", "batal"]),
    notes: z.string().optional(),
    actualCost: z.number().optional(),
    userId: z.string() // Who performed the action
});

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
    const allServices = await db.query.services.findMany({
        with: {
            technician: true
        },
        orderBy: [desc(services.dateIn)]
    });
    return c.json(allServices);
});

// GET /:id - Detail
service.get("/:id", async (c) => {
    const id = parseInt(c.req.param("id"));
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
        const result = await tx.insert(services).values({
            no,
            customer: data.customer,
            device: data.device,
            complaint: data.complaint,
            diagnosis: data.diagnosis,
            costEstimate: data.costEstimate,
            technicianId: data.technicianId,
            status: "antrian"
        }).returning({ insertedId: services.id });

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
    const id = parseInt(c.req.param("id"));
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
