export interface Category {
    id: string;
    name: string;
    description?: string | null;
    parentId?: string | null;
    createdAt?: Date | null;
    updatedAt?: Date | null;
    deletedAt?: Date | null;
}

export interface CategoryVariant {
    id: string;
    categoryId: string;
    name: string;
    supplierId?: string | null;
    createdAt?: Date | null;
}

export type CreateCategoryData = {
    id: string;
    name: string;
    description?: string | null;
    parentId?: string | null;
};

export type UpdateCategoryData = Partial<CreateCategoryData>;

export type CreateVariantTemplateData = {
    categoryId: string;
    name: string;
    supplierId?: string | null;
};
