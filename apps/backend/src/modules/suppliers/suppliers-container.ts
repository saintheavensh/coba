import { ContainerModule, injectable, inject } from "inversify";
import { TYPES } from "./types";
import { SupplierRepositoryAdapter } from "./infrastructure";
import {
    GetSuppliersUseCase,
    CreateSupplierUseCase,
    UpdateSupplierUseCase,
    DeleteSupplierUseCase,
    LinkCategoryUseCase,
    UnlinkCategoryUseCase,
    GetSupplierCategoriesUseCase,
    GetMappedProductVariantsUseCase,
    MapProductVariantUseCase,
    UnmapProductVariantUseCase
} from "./application";
import { ISupplierRepository, Supplier, CreateSupplierData, UpdateSupplierData } from "./domain";

/**
 * Suppliers Module Container
 */
export const suppliersContainerModule = new ContainerModule(({ bind }) => {
    // Repositories
    bind<ISupplierRepository>(TYPES.ISupplierRepository).to(SupplierRepositoryAdapter).inSingletonScope();

    // Use Cases
    bind<GetSuppliersUseCase>(TYPES.GetSuppliersUseCase).to(GetSuppliersUseCase).inSingletonScope();
    bind<CreateSupplierUseCase>(TYPES.CreateSupplierUseCase).to(CreateSupplierUseCase).inSingletonScope();
    bind<UpdateSupplierUseCase>(TYPES.UpdateSupplierUseCase).to(UpdateSupplierUseCase).inSingletonScope();
    bind<DeleteSupplierUseCase>(TYPES.DeleteSupplierUseCase).to(DeleteSupplierUseCase).inSingletonScope();
    bind<LinkCategoryUseCase>(TYPES.LinkCategoryUseCase).to(LinkCategoryUseCase).inSingletonScope();
    bind<UnlinkCategoryUseCase>(TYPES.UnlinkCategoryUseCase).to(UnlinkCategoryUseCase).inSingletonScope();
    bind<GetSupplierCategoriesUseCase>(TYPES.GetSupplierCategoriesUseCase).to(GetSupplierCategoriesUseCase).inSingletonScope();
    bind<GetMappedProductVariantsUseCase>(TYPES.GetMappedProductVariantsUseCase).to(GetMappedProductVariantsUseCase).inSingletonScope();
    bind<MapProductVariantUseCase>(TYPES.MapProductVariantUseCase).to(MapProductVariantUseCase).inSingletonScope();
    bind<UnmapProductVariantUseCase>(TYPES.UnmapProductVariantUseCase).to(UnmapProductVariantUseCase).inSingletonScope();

    // Facade/Service
    bind<SuppliersFacade>(TYPES.SuppliersFacade).to(SuppliersFacade).inSingletonScope();
});

/**
 * SuppliersFacade — Facade for external and presentation layers.
 */
@injectable()
export class SuppliersFacade {
    constructor(
        @inject(TYPES.GetSuppliersUseCase) private readonly getSuppliersUC: GetSuppliersUseCase,
        @inject(TYPES.CreateSupplierUseCase) private readonly createSupplierUC: CreateSupplierUseCase,
        @inject(TYPES.UpdateSupplierUseCase) private readonly updateSupplierUC: UpdateSupplierUseCase,
        @inject(TYPES.DeleteSupplierUseCase) private readonly deleteSupplierUC: DeleteSupplierUseCase,
        @inject(TYPES.LinkCategoryUseCase) private readonly linkCategoryUC: LinkCategoryUseCase,
        @inject(TYPES.UnlinkCategoryUseCase) private readonly unlinkCategoryUC: UnlinkCategoryUseCase,
        @inject(TYPES.GetSupplierCategoriesUseCase) private readonly getSupplierCategoriesUC: GetSupplierCategoriesUseCase,
        @inject(TYPES.GetMappedProductVariantsUseCase) private readonly getMappedProductVariantsUC: GetMappedProductVariantsUseCase,
        @inject(TYPES.MapProductVariantUseCase) private readonly mapProductVariantUC: MapProductVariantUseCase,
        @inject(TYPES.UnmapProductVariantUseCase) private readonly unmapProductVariantUC: UnmapProductVariantUseCase
    ) { }

    async getAll() {
        return await this.getSuppliersUC.execute();
    }

    async getLinkedCategories(supplierId: string) {
        return await this.getSupplierCategoriesUC.execute(supplierId);
    }

    async create(data: CreateSupplierData) {
        return await this.createSupplierUC.execute(data);
    }

    async update(id: string, data: UpdateSupplierData) {
        return await this.updateSupplierUC.execute(id, data);
    }

    async delete(id: string) {
        return await this.deleteSupplierUC.execute(id);
    }

    async linkCategory(supplierId: string, categoryId: string) {
        return await this.linkCategoryUC.execute(supplierId, categoryId);
    }

    async unlinkCategory(supplierId: string, categoryId: string) {
        return await this.unlinkCategoryUC.execute(supplierId, categoryId);
    }

    async getMappedProductVariants(supplierId: string) {
        return await this.getMappedProductVariantsUC.execute(supplierId);
    }

    async mapProductVariant(supplierId: string, productId: string, variantId?: string | null) {
        return await this.mapProductVariantUC.execute(supplierId, productId, variantId);
    }

    async unmapProductVariant(supplierId: string, productId: string, variantId?: string | null) {
        return await this.unmapProductVariantUC.execute(supplierId, productId, variantId);
    }
}
