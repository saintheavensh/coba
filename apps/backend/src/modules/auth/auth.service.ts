import { AuthRepository } from "./auth.repository";
import { loginSchema } from "@repo/shared";
import { z } from "zod";
import { sign } from "hono/jwt";

// Secret should be env
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

export class AuthService {
    private repo: AuthRepository;

    constructor() {
        this.repo = new AuthRepository();
    }

    async login(data: z.infer<typeof loginSchema>) {
        const user = await this.repo.findByUsername(data.username);

        if (!user) {
            throw new Error("Invalid username or password");
        }

        const isValid = await Bun.password.verify(data.password, user.password);
        if (!isValid) {
            throw new Error("Invalid username or password");
        }

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
            role: data.role
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
        }));
    }

    async updateUser(id: string, data: { name?: string; role?: "admin" | "teknisi" | "kasir"; isActive?: boolean; password?: string }) {
        const updateData: any = { ...data };
        if (data.password) {
            updateData.password = await Bun.password.hash(data.password);
        }

        const updated = await this.repo.update(id, updateData);
        if (!updated.length) {
            throw new Error("User not found");
        }
        return {
            id: updated[0].id,
            name: updated[0].name,
            username: updated[0].username,
            role: updated[0].role,
            isActive: updated[0].isActive,
        };
    }

    async deleteUser(id: string) {
        const deleted = await this.repo.delete(id);
        if (!deleted.length) {
            throw new Error("User not found");
        }
        return true;
    }
}
