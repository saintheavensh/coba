import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { CustomersService } from "./customers.service";

const customersController = new Hono();
const membersService = new CustomersService();

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

customersController.get("/", async (c) => {
    const query = c.req.query("q");
    const customers = await membersService.getAll(query);
    return c.json({ success: true, data: customers });
});

customersController.get("/:id", async (c) => {
    const id = c.req.param("id");
    const customer = await membersService.getById(id);
    return c.json({ success: true, data: customer });
});

customersController.post(
    "/",
    zValidator("json", customerSchema),
    async (c) => {
        const data = c.req.valid("json");
        const customer = await membersService.create(data);
        return c.json({ success: true, data: customer }, 201);
    }
);

customersController.put(
    "/:id",
    zValidator("json", updateCustomerSchema),
    async (c) => {
        const id = c.req.param("id");
        const data = c.req.valid("json");
        const customer = await membersService.update(id, data);
        return c.json({ success: true, data: customer });
    }
);

customersController.delete("/:id", async (c) => {
    const id = c.req.param("id");
    await membersService.delete(id);
    return c.json({ success: true, message: "Customer deleted successfully" });
});

const paymentSchema = z.object({
    amount: z.number().min(1),
    notes: z.string().optional(),
    saleId: z.string().optional(),
    proofImage: z.string().optional()
});

customersController.get("/:id/sales", async (c) => {
    const id = c.req.param("id");
    const sales = await membersService.getSales(id);
    return c.json({ success: true, data: sales });
});

customersController.get("/:id/unpaid-sales", async (c) => {
    const id = c.req.param("id");
    const sales = await membersService.getUnpaidSales(id);
    return c.json({ success: true, data: sales });
});

customersController.post(
    "/:id/payment",
    zValidator("json", paymentSchema),
    async (c) => {
        const id = c.req.param("id");
        const { amount, notes, saleId, proofImage } = c.req.valid("json");
        const customer = await membersService.processPayment(id, amount, notes, saleId, proofImage);
        return c.json({ success: true, data: customer });
    }
);

export { customersController };
