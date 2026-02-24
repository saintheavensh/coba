import { Result } from "../../../../shared/core/Result";
import { Product } from "../../domain/entities/Product.entity";
import { Price } from "../../domain/value-objects/Price.vo";
import { Sku } from "../../domain/value-objects/Sku.vo";
import { ProductStatus, Status } from "../../domain/value-objects/ProductStatus.vo";
import { ProductDTO } from "../dtos/ProductDTO";

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
            status: product.status.value,
            categoryId: product.categoryId,
            createdAt: product.createdAt,
            updatedAt: product.updatedAt
        };
    }

    /**
     * Maps a raw database persistence object to a Domain Entity.
     */
    public static toDomain(raw: any): Result<Product> {
        const skuResult = Sku.create(raw.sku);
        const priceResult = Price.create(raw.price);
        const statusResult = ProductStatus.create(raw.status as Status);

        const result = Result.combine([skuResult, priceResult, statusResult]);
        if (result.isFailure) {
            return Result.fail<Product>(result.errorValue());
        }

        return Product.create(
            {
                sku: skuResult.getValue(),
                name: raw.name,
                price: priceResult.getValue(),
                status: statusResult.getValue(),
                categoryId: raw.categoryId,
                createdAt: raw.createdAt,
                updatedAt: raw.updatedAt
            },
            raw.id
        );
    }

    /**
     * Maps a Domain Entity to a raw object for database persistence.
     */
    public static toPersistence(product: Product): any {
        return {
            id: product.id,
            sku: product.sku.value,
            name: product.name,
            price: product.price.amount,
            status: product.status.value,
            categoryId: product.categoryId,
            createdAt: product.createdAt,
            updatedAt: product.updatedAt
        };
    }
}
