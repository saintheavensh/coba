import { z } from "zod";

export const labelSchema = z.object({
    productName: z.string(),
    variantName: z.string().optional(),
    code: z.string(),
    price: z.number().optional()
});
