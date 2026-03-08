import { Result } from "../../../../shared/core/Result";
import { Product } from "../../domain/entities/Product.entity";
import { Price } from "../../domain/value-objects/Price.vo";
import { Sku } from "../../domain/value-objects/Sku.vo";
import { ProductStatus, Status } from "../../domain/value-objects/ProductStatus.vo";
import { ProductDTO } from "../dtos/ProductDTO";
import { NewProductRow } from "../../infrastructure/schema/ProductSchema";

/**
 * ProductMapper
 * Responsible for mapping data between layers to maintain decoupling.
 */
export class ProductMapper {
    /**
     * Maps a domain Entity to a DTO for the presentation layer.
     */
    public static toDTO(product: Product): ProductDTO {
        return {
            id: product.id,
            sku: product.sku.value,
            name: product.name,
            price: product.price.amount,
            stock: product.stock,
            status: product.status.value,
            categoryId: product.categoryId,
            createdAt: product.createdAt,
            updatedAt: product.updatedAt
        };
    }

    /**
     * Maps a raw database persistence object to a Domain Entity.
     * Includes joined fields like stock and price from batches.
     */
    public static toDomain(raw: {
        id: string;
        code: string | null;
        name: string;
        price: number;
        categoryId: string | null;
        createdAt: Date | null;
        updatedAt: Date | null;
        stock: number;
    }): Result<Product> {
        const skuResult = Sku.create(raw.code || "");
        const priceResult = Price.create(raw.price || 0); // Default price to 0 if not fetched from batch
        const statusResult = ProductStatus.create(Status.ACTIVE);

        const result = Result.combine([skuResult, priceResult, statusResult]);
        if (result.isFailure) {
            return Result.fail<Product>(result.errorValue());
        }

        return Product.create(
            {
                sku: skuResult.getValue(),
                name: raw.name,
                price: priceResult.getValue(),
                stock: raw.stock || 0,
                status: statusResult.getValue(),
                categoryId: raw.categoryId || "",
                createdAt: raw.createdAt || new Date(),
                updatedAt: raw.updatedAt || new Date()
            },
            raw.id
        );
    }

    /**
     * Maps a Domain Entity to a raw object for database persistence.
     */
    public static toPersistence(product: Product): NewProductRow {
        return {
            id: product.id,
            code: product.sku.value, // Maps back to the DB `code` field
            name: product.name,
            categoryId: product.categoryId,
            createdAt: product.createdAt,
            updatedAt: product.updatedAt
        };
    }
}
