export const TYPES = {
    // Domain/Ports
    ISupplierRepository: Symbol.for("ISupplierRepository"),

    // Application/UseCases
    GetSuppliersUseCase: Symbol.for("GetSuppliersUseCase"),
    CreateSupplierUseCase: Symbol.for("CreateSupplierUseCase"),
    UpdateSupplierUseCase: Symbol.for("UpdateSupplierUseCase"),
    DeleteSupplierUseCase: Symbol.for("DeleteSupplierUseCase"),
    LinkCategoryUseCase: Symbol.for("LinkCategoryUseCase"),
    UnlinkCategoryUseCase: Symbol.for("UnlinkCategoryUseCase"),
    GetSupplierCategoriesUseCase: Symbol.for("GetSupplierCategoriesUseCase"),
    GetMappedProductVariantsUseCase: Symbol.for("GetMappedProductVariantsUseCase"),
    MapProductVariantUseCase: Symbol.for("MapProductVariantUseCase"),
    UnmapProductVariantUseCase: Symbol.for("UnmapProductVariantUseCase"),

    // Facade/Service
    SuppliersFacade: Symbol.for("SuppliersFacade"),

    // Shared
    DrizzleClient: Symbol.for("DrizzleClient"),
    LoggerFactory: Symbol.for("LoggerFactory")
};
