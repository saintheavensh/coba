import { OpenAPIHono } from '@hono/zod-openapi';
import { swaggerUI } from '@hono/swagger-ui';

export const swaggerApp = new OpenAPIHono();

// Configure OpenAPI info
swaggerApp.doc('/spec', {
    openapi: '3.0.0',
    info: {
        title: 'Coba App Backend API',
        version: '1.0.0',
        description: 'Complete API documentation for the Coba Application Backend',
        contact: {
            name: 'API Support',
            email: 'support@coba.com'
        }
    },
    servers: [
        {
            url: 'http://localhost:3000',
            description: 'Development server'
        },
        {
            url: 'https://api.coba.com',
            description: 'Production server'
        }
    ],
    tags: [
        { name: 'Products', description: 'Product management endpoints' },
        { name: 'Sales', description: 'Sales and transactions' },
        { name: 'Inventory', description: 'Inventory management' },
        { name: 'Auth', description: 'Authentication endpoints' },
        { name: 'Dashboard', description: 'Dashboard and analytics' }
    ]
});

// Register Security Scheme
swaggerApp.openAPIRegistry.registerComponent('securitySchemes', 'bearerAuth', {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT'
});

// Serve Swagger UI
swaggerApp.get('/docs', swaggerUI({ url: '/spec' }));
