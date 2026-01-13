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
        const token = await sign({
            id: user.id,
            username: user.username,
            role: user.role,
            exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 // 24 hours
        }, JWT_SECRET);

        return {
            token,
            user: {
                id: user.id,
                name: user.name,
                role: user.role
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
            role: u.role
        }));
    }
}
