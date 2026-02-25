import { Context, Next } from 'hono';
import { Logger } from '../../utils/logger/Logger';
import { randomUUID } from 'crypto';

const logger = new Logger('HTTP');

export async function loggerMiddleware(c: Context, next: Next) {
    const requestId = randomUUID();
    const start = Date.now();

    // Add requestId to context for child loggers
    c.set('requestId', requestId);
    c.set('logger', logger.child({ requestId }));

    // Log request
    logger.info('Incoming request', {
        requestId,
        method: c.req.method,
        path: c.req.path,
        query: c.req.query(),
        ip: c.req.header('x-forwarded-for') || c.req.header('x-real-ip')
    });

    try {
        await next();

        // Log response
        const duration = Date.now() - start;
        logger.info('Request completed', {
            requestId,
            status: c.res.status,
            duration
        });
    } catch (error) {
        const duration = Date.now() - start;
        logger.error('Request failed', error, {
            requestId,
            duration
        });
        throw error;
    }
}
