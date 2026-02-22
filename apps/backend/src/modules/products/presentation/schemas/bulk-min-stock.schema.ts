import { z } from "zod";

export const bulkMinStockSchema = z.object({
    categoryId: z.string().min(1, "Category ID is required"),
    minStock: z.number().min(0, "Min stock must be 0 or greater")
});
