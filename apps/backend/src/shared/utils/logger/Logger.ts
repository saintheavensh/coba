import { appConfig } from "../../infrastructure/config/AppConfig";

export class Logger {
    private static isDev = !appConfig.isProduction;

    static info(message: string, meta?: any) {
        if (process.env.NODE_ENV === 'test') return;

        if (this.isDev) {
            const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
            console.log(`[INFO] ${message}${metaStr}`);
        } else {
            console.log(JSON.stringify({ level: 'INFO', message, meta, timestamp: new Date().toISOString() }));
        }
    }

    static error(message: string, error?: any) {
        if (process.env.NODE_ENV === 'test') return;

        const errorDetails = error instanceof Error ?
            { message: error.message, stack: error.stack } :
            error;

        if (this.isDev) {
            console.error(`[ERROR] ${message}`, errorDetails);
        } else {
            console.error(JSON.stringify({ level: 'ERROR', message, error: errorDetails, timestamp: new Date().toISOString() }));
        }
    }

    static warn(message: string, meta?: any) {
        if (process.env.NODE_ENV === 'test') return;

        if (this.isDev) {
            const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
            console.warn(`[WARN] ${message}${metaStr}`);
        } else {
            console.warn(JSON.stringify({ level: 'WARN', message, meta, timestamp: new Date().toISOString() }));
        }
    }

    static debug(message: string, meta?: any) {
        if (!this.isDev) return;

        const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
        console.debug(`[DEBUG] ${message}${metaStr}`);
    }
}
