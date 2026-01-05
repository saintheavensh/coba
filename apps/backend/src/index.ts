import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { db } from "./db";
import { users } from "./db/schema";
import { sql } from "drizzle-orm";

import auth from "./routes/auth";
import inventory from "./routes/inventory";
import service from "./routes/service";

const app = new Hono();

app.use("*", cors());
app.use("*", logger());

app.route("/auth", auth);
app.route("/inventory", inventory);
app.route("/service", service);

app.get("/", (c) => {
    return c.json({ message: "Saint Heavens Backend API is Running!" });
});

app.get("/health", async (c) => {
    try {
        // Simple query to check DB connection
        const result = await db.select({ count: sql<number>`count(*)` }).from(users);
        return c.json({ status: "ok", db_users: result[0].count });
    } catch (e) {
        return c.json({ status: "error", message: String(e) }, 500);
    }
});

export default {
    port: 4000,
    fetch: app.fetch,
};
