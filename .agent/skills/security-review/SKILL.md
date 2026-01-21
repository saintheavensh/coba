---
name: security-review
description: Use this skill when adding authentication, handling user input, working with secrets, or creating Hono API endpoints.
---

# Security Review Skill

This skill ensures all code follows security best practices for Hono, Drizzle, and Svelte applications.

## Security Checklist

### 1. Secrets Management
*   **❌ NEVER**: Hardcode API keys or DB passwords.
*   **✅ ALWAYS**: Use `process.env` (Node/Bun) or `$env` (SvelteKit).

### 2. Input Validation (Zod)
Always validate request bodies and query params.

```typescript
// Hono Validator
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

const schema = z.object({
    email: z.string().email()
});

app.post('/user', zValidator('json', schema), (c) => {
    const data = c.req.valid('json');
    // Safe to use data
});
```

### 3. SQL Injection Prevention (Drizzle)
Drizzle ORM handles parameterization automatically.

```typescript
// ✅ Safe
await db.select().from(users).where(eq(users.email, email));

// ❌ Dangerous (avoid raw SQL string concatenation)
await db.execute(sql`SELECT * FROM users WHERE email = '${email}'`); 
```

### 4. Authentication & Authorization

#### 4.1 Password Security
*   **❌ NEVER**: Store passwords in plain text or using weak hashes (MD5, SHA1).
*   **✅ ALWAYS**: Use **Argon2id** or **Bcrypt**.
*   **✅ ALWAYS**: Enforce minimum password strength (zod-zxcvbn).

#### 4.2 Session Management
*   **❌ NEVER**: Store JWTs in `localStorage` (XSS vulnerable).
*   **✅ ALWAYS**: Use **HttpOnly, Secure, SameSite=Strict** Cookies.

#### 4.3 Token Management
*   **Access Tokens**: Short-lived (e.g., 15-30 mins).
*   **Refresh Tokens**: Long-lived (e.g., 7 days), stored securely in DB + HttpOnly cookie (path restricted).

#### 4.4 Hono Middleware Implementation
Protect routes using centralized middleware.

```typescript
app.use('/api/*', async (c, next) => {
    const token = getCookie(c, 'access_token');
    if (!token) return c.json({ error: 'Unauthorized' }, 401);
    
    // Verify & update context
    const user = await verifyToken(token);
    c.set('user', user);
    
    await next();
});
```

### 5. XSS Prevention (Svelte)
Svelte automatically escapes content in `{}` tags.
*   **⚠️ Danger**: Avoid `{@html content}` unless content is heavily sanitized (e.g., using DOMPurify).

### 6. CSRF Protection
Ensure state-changing API requests use proper verification (custom headers or Hono CSRF middleware).

## Verification Steps
- [ ] All inputs validated with Zod.
- [ ] No `{@html}` in Svelte without sanitization.
- [ ] Secrets loaded from env only.
- [ ] Auth checks present on protected routes.
