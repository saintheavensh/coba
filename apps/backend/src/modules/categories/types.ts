export const TYPES = {
    // Domain/Ports
    ICategoryRepository: Symbol.for("ICategoryRepository"),

    // Application/UseCases
    GetCategoriesUseCase: Symbol.for("GetCategoriesUseCase"),
    CreateCategoryUseCase: Symbol.for("CreateCategoryUseCase"),
    UpdateCategoryUseCase: Symbol.for("UpdateCategoryUseCase"),
    DeleteCategoryUseCase: Symbol.for("DeleteCategoryUseCase"),
    AddVariantTemplateUseCase: Symbol.for("AddVariantTemplateUseCase"),
    RemoveVariantTemplateUseCase: Symbol.for("RemoveVariantTemplateUseCase"),

    // Services
    CategoryVariantPropagationService: Symbol.for("CategoryVariantPropagationService"),

    // Facades
    CategoriesFacade: Symbol.for("CategoriesFacade")
};
