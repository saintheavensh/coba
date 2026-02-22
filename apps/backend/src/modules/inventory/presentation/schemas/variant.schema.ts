import { z } from "zod";

export const variantSchema = z.object({
    productId: z.string(),
    name: z.string(),
    image: z.string().optional(),
    sku: z.string().optional(),
    defaultPrice: z.number().optional()
});
