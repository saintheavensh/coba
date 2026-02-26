/**
 * Port for user lookup. Keeps use cases independent of DB implementation.
 */

export interface UserWithRoles {
    id: string;
    username: string;
    name: string;
    password: string;
    roles?: Array<{ role: { id: string; name?: string; permissions?: unknown } }>;
    role?: string;
}

export interface IUserRepository {
    findByUsername(username: string, dbOrTx?: unknown): Promise<UserWithRoles | null>;
    findById(id: string, dbOrTx?: unknown): Promise<UserWithRoles | null>;
    createSession(userId: string, role: string, dbOrTx?: unknown): Promise<string>;
    deactivateSession(sessionId: string, dbOrTx?: unknown): Promise<void>;
}

