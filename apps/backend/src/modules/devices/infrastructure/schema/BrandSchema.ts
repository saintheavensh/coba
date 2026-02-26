import { text, timestamp, pgTable } from "drizzle-orm/pg-core";

export const brands = pgTable("brands", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    logo: text("logo"),
    createdAt: timestamp("created_at").defaultNow(),
});
