import { Entity } from "../../../../shared/core/Entity";
import { Result } from "../../../../shared/core/Result";
import { Price } from "../value-objects/Price.vo";
import { Sku } from "../value-objects/Sku.vo";
import { ProductStatus, Status } from "../value-objects/ProductStatus.vo";

interface ProductProps {
    sku: Sku;
    name: string;
    price: Price;
    status: ProductStatus;
    categoryId: string;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Product Entity
 * Encapsulates the core business logic for products in the catalog.
 */
export class Product extends Entity<ProductProps> {
    private constructor(props: ProductProps, id?: string) {
        super(props, id);
    }

    get sku(): Sku { return this.props.sku; }
    get name(): string { return this.props.name; }
    get price(): Price { return this.props.price; }
    get status(): ProductStatus { return this.props.status; }
    get categoryId(): string { return this.props.categoryId; }
    get createdAt(): Date { return this.props.createdAt; }
    get updatedAt(): Date { return this.props.updatedAt; }

    public static create(
        props: {
            sku: Sku;
            name: string;
            price: Price;
            status?: ProductStatus;
            categoryId: string;
            createdAt?: Date;
            updatedAt?: Date;
        },
        id?: string
    ): Result<Product> {
        if (!props.name || props.name.trim().length === 0) {
            return Result.fail("Product name cannot be empty");
        }

        const defaultStatus = props.status || ProductStatus.create(Status.DRAFT).getValue();

        return Result.ok(
            new Product(
                {
                    ...props,
                    status: defaultStatus,
                    createdAt: props.createdAt || new Date(),
                    updatedAt: props.updatedAt || new Date()
                },
                id
            )
        );
    }

    public activate(): Result<void> {
        const transition = this.status.transitionTo(Status.ACTIVE);
        if (transition.isFailure) {
            return Result.fail(transition.errorValue());
        }
        this.props.status = transition.getValue();
        this.props.updatedAt = new Date();
        return Result.ok();
    }

    public deactivate(): Result<void> {
        const transition = this.status.transitionTo(Status.INACTIVE);
        if (transition.isFailure) {
            return Result.fail(transition.errorValue());
        }
        this.props.status = transition.getValue();
        this.props.updatedAt = new Date();
        return Result.ok();
    }

    public archive(): Result<void> {
        const transition = this.status.transitionTo(Status.ARCHIVED);
        if (transition.isFailure) {
            return Result.fail(transition.errorValue());
        }
        this.props.status = transition.getValue();
        this.props.updatedAt = new Date();
        return Result.ok();
    }

    public updatePrice(newPrice: Price): void {
        this.props.price = newPrice;
        this.props.updatedAt = new Date();
    }

    public updateName(newName: string): Result<void> {
        if (!newName || newName.trim().length === 0) {
            return Result.fail("Product name cannot be empty");
        }
        this.props.name = newName;
        this.props.updatedAt = new Date();
        return Result.ok();
    }

    /**
     * Business rule: Check if product can be deleted.
     * Note: Final check usually needs context from Sales/Inventory,
     * but domain entity can provide the internal state check.
     */
    public canBeDeleted(): boolean {
        return this.status.value === Status.DRAFT || this.status.value === Status.INACTIVE;
    }
}
