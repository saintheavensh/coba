import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { requireRole } from "../../../middlewares/permission.middleware";
import { AccountingController } from "./accounting.controller";

const app = new Hono();
const controller = new AccountingController();

app.use("*", authMiddleware);
app.use("*", requireRole("super_admin", "owner", "manager"));

// Accounts
app.get("/accounts", (c) => controller.getAllAccounts(c));
app.get("/accounts/tree", (c) => controller.getAccountTree(c));
app.get("/accounts/types", (c) => controller.getAccountTypes(c));

const createAccountSchema = z.object({
    code: z.string().min(3),
    name: z.string().min(2),
    typeId: z.string(),
    parentId: z.string().optional(),
    description: z.string().optional(),
});
app.post("/accounts", zValidator("json", createAccountSchema), (c) => controller.createAccount(c));
app.patch("/accounts/:id", (c) => controller.updateAccount(c));
app.delete("/accounts/:id", (c) => controller.deleteAccount(c));

// Journals
app.get("/journals", (c) => controller.getAllJournals(c));
app.get("/journals/:id", (c) => controller.getJournalById(c));

// Cash Register
app.get("/register/current", (c) => controller.getCurrentRegister(c));
app.post("/register/open", (c) => controller.openRegister(c));
app.post("/register/close", (c) => controller.closeRegister(c));
app.post("/register/expense", (c) => controller.recordExpense(c));

// Assets
app.get("/assets", (c) => controller.getAllAssets(c));
app.post("/assets", (c) => controller.createAsset(c));

export default app;
