export interface Role {
    id: string;
    name: string;
    permissions?: string[];
    createdAt?: Date;
}

export interface UserRole {
    id: string;
    userId: string;
    role: string;
    isActive: boolean;
    createdAt: Date;
    roleDetail?: Role;
}

export interface User {
    id: string;
    username: string;
    name: string;
    image?: string | null;
    role: string;
    isActive: boolean;
    commissionConfig?: any; // Keep any if complex, but will refine later if possible
    roles?: UserRole[];
    createdAt: Date;
    updatedAt?: Date | null;
    deletedAt?: Date | null;
}

export type CreateUserData = Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'roles'> & {
    roles?: string[];
    password: string;
};

export type UpdateUserData = Partial<CreateUserData>;
