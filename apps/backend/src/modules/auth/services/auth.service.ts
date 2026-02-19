import { AuthModel } from "../models/auth.model";
import { sign } from "hono/jwt";
import { apiError } from "../../../lib/response";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

export class AuthService {
    private model: AuthModel;

    constructor() {
        this.model = new AuthModel();
    }

    async login(username: string, passwordRaw: string, dbOrTx?: any) {
        const user = await this.model.findByUsername(username, dbOrTx);

        if (!user) {
            throw new Error("Invalid username or password");
        }

        const isMatch = await Bun.password.verify(passwordRaw, user.password);
        if (!isMatch) {
            throw new Error("Invalid username or password");
        }

        // Generate Token
        // roles relation is: roles: [{ role: { id, name, permissions } }]
        const userRoles = (user as any).roles?.map((ur: any) => ur.role.id) || [user.role];

        const payload = {
            id: user.id,
            username: user.username,
            name: user.name,
            role: userRoles.includes('owner') ? 'owner' : userRoles[0], // Primary role for legacy support
            roles: userRoles, // Complete list of roles
            exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7), // 7 days
        };

        const token = await sign(payload, JWT_SECRET);

        // Don't return password
        const { password, ...userWithoutPassword } = user;

        return {
            user: {
                ...userWithoutPassword,
                roles: userRoles
            },
            token
        };
    }

    async findById(id: string, dbOrTx?: any) {
        return await this.model.findById(id, dbOrTx);
    }
}
