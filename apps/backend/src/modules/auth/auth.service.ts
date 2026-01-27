import { AuthRepository } from "./auth.repository";
import { loginSchema } from "@repo/shared";
import { z } from "zod";
import { sign } from "hono/jwt";
import { Logger } from "../../lib/logger";
import { ActivityLogService } from "../../lib/activity-log.service";

// Secret should be env
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

export class AuthService {
    private repo: AuthRepository;

    constructor() {
        this.repo = new AuthRepository();
    }

    async login(data: z.infer<typeof loginSchema>) {
        Logger.debug(`[AUTH_SERVICE] Looking up user: ${data.username}`);
        const user = await this.repo.findByUsername(data.username);

        if (!user) {
            Logger.warn(`[AUTH_SERVICE] User not found: ${data.username}`);
            throw new Error("Invalid username or password");
        }

        Logger.debug(`[AUTH_SERVICE] User found: ${user.username}, isActive: ${user.isActive ?? true}`);

        if (user.isActive === false) {
            Logger.warn(`[AUTH_SERVICE] User account is inactive: ${user.username}`);
            throw new Error("Account is inactive");
        }

        Logger.debug(`[AUTH_SERVICE] Verifying password for user: ${user.username}`);
        const isValid = await Bun.password.verify(data.password, user.password);
        if (!isValid) {
            Logger.warn(`[AUTH_SERVICE] Password verification failed for user: ${user.username}`);
            throw new Error("Invalid username or password");
        }

        Logger.debug(`[AUTH_SERVICE] Password verified successfully for user: ${user.username}`);

        // Log Login Action
        await ActivityLogService.log({
            userId: user.id,
            action: "LOGIN",
            entityType: "auth",
            entityId: user.id,
            description: `User ${user.username} logged in`,
        });

        // Generate Token
        // Since we fetch with relation, user.role is now an object { id, name, permissions }
        // BUT Typescript might infer it as string if schema definition is strict.
        // Drizzle relational queries return the object if 'with' is used.
        // We cast as any to access permissions safely or rely on drizzle inference.

        const roleData = user.role as any;
        // Fallback permissions just in case
        const permissions = roleData?.permissions || [];

        const token = await sign({
            id: user.id,
            username: user.username,
            role: typeof user.role === 'string' ? user.role : (user.role as any).id, // Keep role ID as string in token for compat
            permissions: permissions, // Add permissions array
            exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 // 24 hours
        }, JWT_SECRET);

        return {
            token,
            user: {
                id: user.id,
                name: user.name,
                username: user.username,
                role: typeof user.role === 'string' ? user.role : (user.role as any).id,
                permissions: permissions
            }
        };
    }

    async register(data: any) {
        // Basic register logic if needed
        // For now relying on seed
        const hashedPassword = await Bun.password.hash(data.password);
        const id = "USR-" + Date.now();
        return await this.repo.create({
            id,
            username: data.username,
            password: hashedPassword,
            name: data.name,
            role: data.role,
            commissionConfig: data.commissionConfig || null,
        });
    }

    async getUsersByRole(role: "admin" | "teknisi" | "kasir") {
        const users = await this.repo.findByRole(role);
        // Return only safe fields, exclude password
        return users.map(u => ({
            id: u.id,
            name: u.name,
            username: u.username,
            role: u.role,
            isActive: u.isActive ?? true,
            commissionConfig: u.commissionConfig,
        }));
    }

    async getAllUsers() {
        const users = await this.repo.findAll();
        // Return only safe fields, exclude password
        return users.map(u => ({
            id: u.id,
            name: u.name,
            username: u.username,
            role: u.role,
            isActive: u.isActive ?? true,
            commissionConfig: u.commissionConfig,
        }));
    }

    async updateUser(id: string, data: { name?: string; role?: "admin" | "teknisi" | "kasir"; isActive?: boolean; password?: string; commissionConfig?: any }, performerId?: string) {
        const updateData: any = { ...data };
        if (data.password) {
            updateData.password = await Bun.password.hash(data.password);
        }

        const oldValue = await this.repo.findById(id);
        const updated = await this.repo.update(id, updateData);
        if (!updated.length) {
            throw new Error("User not found");
        }

        if (performerId) {
            await ActivityLogService.log({
                userId: performerId,
                action: "UPDATE",
                entityType: "user",
                entityId: id,
                description: `Updated user profile for ${updated[0].username}`,
                details: {
                    oldValue,
                    newValue: updated[0]
                }
            });
        }

        return {
            id: updated[0].id,
            name: updated[0].name,
            username: updated[0].username,
            role: updated[0].role,
            isActive: updated[0].isActive,
            commissionConfig: updated[0].commissionConfig,
        };
    }

    async deleteUser(id: string, performerId?: string) {
        const oldValue = await this.repo.findById(id);
        const deleted = await this.repo.delete(id);
        if (!deleted.length) {
            throw new Error("User not found");
        }

        if (performerId) {
            await ActivityLogService.log({
                userId: performerId,
                action: "DELETE",
                entityType: "user",
                entityId: id,
                description: `Deleted user ${oldValue?.username || id}`,
                details: { oldValue }
            });
        }

        return true;
    }
}

// End of AuthService
