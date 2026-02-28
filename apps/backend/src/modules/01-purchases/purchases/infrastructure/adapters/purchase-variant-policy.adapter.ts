import { db } from "../../../../../shared/infrastructure/database/client";
import { products, categoryVariants } from "../../../../../shared/infrastructure/database/schema";
import { eq, and } from "drizzle-orm";
import { IPurchaseVariantPolicyGateway } from "../../domain/purchase-repository.port";

export class PurchaseVariantPolicyAdapter implements IPurchaseVariantPolicyGateway {
    async ensureVariantAllowedForSupplier(
        params: { productId: string; variantName: string; supplierId: string },
        dbOrTx?: unknown
    ): Promise<void> {
        const client: any = dbOrTx || db;

        const product = await client.query.products.findFirst({
            where: eq(products.id, params.productId),
            columns: { categoryId: true }
        });

        if (!product?.categoryId) {
            return;
        }

        const templates = await client.query.categoryVariants.findMany({
            where: and(
                eq(categoryVariants.categoryId, product.categoryId),
                eq(categoryVariants.name, params.variantName)
            )
        });

        if (templates.length === 0) {
            return;
        }

        const isAllowed = templates.some((t: any) =>
            t.supplierId === null || t.supplierId === params.supplierId
        );

        if (!isAllowed) {
            throw new Error(`Varian '${params.variantName}' tidak tersedia untuk supplier ini.`);
        }
    }
}

