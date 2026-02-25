/**
 * Products API routes — exact same route paths as the old inventory product routes.
 * Schemas imported from local presentation/schemas/.
 */
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { zValidator } from "@hono/zod-validator";
import { ProductsController } from "./products.controller";
import { productsService } from "../products-container";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { requirePermission } from "../../../middlewares/permission.middleware";
import { variantSchema, createVariantSchema } from "./schemas/variant.schema";
import { bulkMinStockSchema } from "./schemas/bulk-min-stock.schema";
import { labelSchema } from "./schemas/label.schema";

const app = new OpenAPIHono();
const controller = new ProductsController(productsService);

// ============================================
// OPENAPI ROUTE DEFINITIONS
// ============================================

const getAllProductsRoute = createRoute({
    method: 'get',
    path: '/',
    tags: ['Products'],
    description: 'Get paginated list of products',
    responses: {
        200: {
            description: 'Paginated list of products',
            content: {
                'application/json': {
                    schema: z.object({
                        data: z.array(z.any()),
                        meta: z.object({
                            page: z.number().default(1),
                            limit: z.number().default(20),
                            totalItems: z.number().default(0),
                            totalPages: z.number().default(0),
                            hasNext: z.boolean().default(false),
                            hasPrev: z.boolean().default(false)
                        }).optional()
                    })
                }
            }
        }
    }
});

const getProductByIdRoute = createRoute({
    method: 'get',
    path: '/{id}',
    tags: ['Products'],
    description: 'Get product by ID',
    request: {
        params: z.object({
            id: z.string().openapi({ description: 'Product ID' })
        })
    },
    responses: {
        200: {
            description: 'Product found',
            content: {
                'application/json': {
                    schema: z.any()
                }
            }
        }
    }
});

const zCreateProduct = z.object({
    name: z.string().min(1).max(255).openapi({ example: 'New Product' }),
    sku: z.string().openapi({ example: 'SKU-123' }),
    price: z.number().min(0).openapi({ example: 10000 }),
    categoryId: z.string().uuid().openapi({ example: '123e4567-e89b-12d3-a456-426614174000' })
});

const zUpdateProduct = z.object({
    name: z.string().min(1).max(255).optional().openapi({ example: 'Updated Product' }),
    sku: z.string().optional().openapi({ example: 'SKU-123' }),
    price: z.number().min(0).optional().openapi({ example: 15000 }),
    categoryId: z.string().uuid().optional().openapi({ example: '123e4567-e89b-12d3-a456-426614174000' }),
    status: z.enum(['DRAFT', 'ACTIVE', 'INACTIVE']).optional().openapi({ example: 'ACTIVE' })
});

const createProductRoute = createRoute({
    method: 'post',
    path: '/',
    tags: ['Products'],
    description: 'Create a new product',
    security: [{ bearerAuth: [] }],
    request: {
        body: {
            content: {
                'application/json': {
                    schema: zCreateProduct
                }
            }
        }
    },
    responses: {
        201: { description: 'Product created' },
        400: { description: 'Validation Error' },
    }
});

const updateProductRoute = createRoute({
    method: 'put',
    path: '/{id}',
    tags: ['Products'],
    description: 'Update product by ID',
    security: [{ bearerAuth: [] }],
    request: {
        params: z.object({
            id: z.string().openapi({ description: 'Product ID' })
        }),
        body: {
            content: {
                'application/json': {
                    schema: zUpdateProduct
                }
            }
        }
    },
    responses: {
        200: { description: 'Product updated' },
        400: { description: 'Validation Error' },
    }
});

const deleteProductRoute = createRoute({
    method: 'delete',
    path: '/{id}',
    tags: ['Products'],
    description: 'Delete product by ID',
    security: [{ bearerAuth: [] }],
    request: {
        params: z.object({
            id: z.string().openapi({ description: 'Product ID' })
        })
    },
    responses: {
        200: { description: 'Product deleted' },
    }
});

// ============================================
// BIND OPENAPI ROUTES TO CONTROLLER
// ============================================

app.openapi(getAllProductsRoute, (c) => controller.getAllProducts(c) as any);
app.openapi(getProductByIdRoute, (c) => controller.getProductById(c) as any);
// Note: for openapi, middlewares are applied inside createRoute if fully migrating, 
// but we just map directly to controller, the security: [{ bearerAuth: [] }] documents it.
app.openapi(createProductRoute, (c) => controller.createProduct(c) as any);
app.openapi(updateProductRoute, (c) => controller.updateProduct(c) as any);
app.openapi(deleteProductRoute, (c) => controller.deleteProduct(c) as any);

// ============================================
// STANDARD ROUTES (Undocumented / Legacy)
// ============================================

app.get("/suppliers/:id/variants", (c) => controller.getSupplierVariants(c));
app.get("/stats", (c) => controller.getStats(c));
app.get("/:id/variants", (c) => controller.getProductVariants(c));
app.get("/searchproduct", authMiddleware, (c) => controller.searchProduct(c));

// Variants
app.post("/variants", authMiddleware, requirePermission("inventory.manage"), zValidator("json", createVariantSchema), (c) => controller.createVariant(c));
app.put("/variants/:id", authMiddleware, requirePermission("inventory.manage"), zValidator("json", variantSchema.partial()), (c) => controller.updateVariant(c));
app.delete("/variants/:id", authMiddleware, requirePermission("inventory.manage"), (c) => controller.deleteVariant(c));

// Bulk Min Stock
app.get("/categories/:id/product-count", (c) => controller.getProductCountByCategory(c));
app.patch("/bulk-min-stock", authMiddleware, requirePermission("inventory.manage"), zValidator("json", bulkMinStockSchema), (c) => controller.bulkUpdateMinStock(c));
app.post("/print-label", authMiddleware, requirePermission("inventory.manage"), zValidator("json", labelSchema), (c) => controller.printLabel(c));

export default app;
