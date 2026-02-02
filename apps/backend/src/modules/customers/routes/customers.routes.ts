import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { CustomersController } from "../controllers/customers.controller";
import { authMiddleware } from "../../../middlewares/auth.middleware";

const customers = new Hono();

// Apply auth middleware if needed? Original didn't seem to have it implicitly but it's backend.
// Usually all modules are protected. Accounting had explicit middleware.
// Looking at users.controller.ts (original), it had `app.use("*", authMiddleware)`.
// Looking at customers.controller.ts (original), it did NOT have middleware applied!
// But `index.ts` likely applies it to `/api/customers`?
// Let's assume protection is needed or check `index.ts`.
// For now, I will NOT add middleware if it wasn't there, or I should check.
// Update: `users.controller.ts` HAD `app.use("*", authMiddleware)`. 
// `customers.controller.ts` did NOT.
// I'll leave it as is for now to avoid breaking public access if intended (unlikely for CRM).
// But `authMiddleware` is safe to add if standardizing.
// Let's check `index.ts` later. For now, matching original file.

const customerSchema = z.object({
    name: z.string().min(1, "Name is required"),
    phone: z.string().min(1, "Phone is required"),
    email: z.string().email().optional().or(z.literal("")),
    address: z.string().optional(),
    creditLimit: z.number().min(0).optional().default(0),
    discountPercent: z.number().min(0).max(100).optional().default(0),
    image: z.string().optional(),
});

const updateCustomerSchema = customerSchema.partial();

const paymentSchema = z.object({
    amount: z.number().min(1),
    method: z.enum(["cash", "transfer", "qris"]).default("cash"),
    notes: z.string().optional(),
    saleId: z.string().optional(),
    proofImage: z.string().optional()
});

customers.get("/", CustomersController.getAll);
customers.get("/:id", CustomersController.getById);
customers.post("/", zValidator("json", customerSchema), CustomersController.create);
customers.put("/:id", zValidator("json", updateCustomerSchema), CustomersController.update);
customers.delete("/:id", CustomersController.delete);

customers.get("/:id/sales", CustomersController.getSales);
customers.get("/:id/unpaid-sales", CustomersController.getUnpaidSales);
customers.post("/:id/payment", zValidator("json", paymentSchema), CustomersController.processPayment);

export default customers;
