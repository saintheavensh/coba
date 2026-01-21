# Backend Development Patterns

Stack: **Hono.js**, **Drizzle ORM**, **Bun/Node**.

## API Design Patterns

### RESTful API Structure

```typescript
// Resource-based Routes with Hono
const app = new Hono();

app.get('/api/markets', ...);      // List
app.get('/api/markets/:id', ...);  // Get single
app.post('/api/markets', ...);     // Create
app.put('/api/markets/:id', ...);  // Replace
app.delete('/api/markets/:id', ...); // Delete
```

### Module Structure

Organize by **Feature Modules**:

```
src/modules/
  ├── auth/
  │   ├── auth.controller.ts  // Route handlers
  │   ├── auth.service.ts     // Business logic
  │   └── auth.schema.ts      // Drizzle schema & Zod types
  ├── devices/
  │   ├── devices.controller.ts
  │   └── ...
```

### Repository/Service Pattern

Separate business logic from data access.

```typescript
// Drizzle Repository (can be inline in Service for simpler apps, but keep logic separate)
export const DeviceService = {
    async findAll(limit: number = 10) {
        return await db.select().from(devices).limit(limit);
    },

    async create(data: NewDevice) {
        // Business Logic Checks
        if (data.price < 0) throw new ApiError("Price cannot be negative", 400);
        
        // Data Access
        const [result] = await db.insert(devices).values(data).returning();
        return result;
    }
};
```

### Middleware Pattern

Use Hono middleware for cross-cutting concerns (Auth, Logging).

```typescript
import { createMiddleware } from 'hono/factory'

export const authMiddleware = createMiddleware(async (c, next) => {
  const token = c.req.header('Authorization');
  if (!token) return c.json({ error: 'Unauthorized' }, 401);
  
  // Verify token...
  await next();
})
```

## Database Patterns (Drizzle)

### Query Optimization

```typescript
// ✅ GOOD: Select only needed columns
const result = await db.query.users.findMany({
    columns: { id: true, name: true },
    where: eq(users.active, true)
});
```

### Transaction Pattern

```typescript
await db.transaction(async (tx) => {
    await tx.insert(orders).values(orderData);
    await tx.update(inventory).set({ stock: newStock }).where(...);
});
```

## Error Handling Patterns

Use a centralized `ApiError` class and middleware.

```typescript
// In global error handler
app.onError((err, c) => {
    if (err instanceof ApiError) {
        return c.json({ success: false, error: err.message }, err.statusCode);
    }
    return c.json({ success: false, error: "Internal Server Error" }, 500);
});
```
