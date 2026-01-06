# Security Rules

## Authentication Security

### Password Handling
- **Hashing**: Bcrypt dengan salt rounds default
- **Storage**: Hanya hash yang disimpan, never plaintext
- **Validation**: Minimum 6 karakter

```typescript
// Hashing
const hash = await Bun.password.hash(password);

// Verification
const valid = await Bun.password.verify(password, hash);
```

### JWT Token
- **Algorithm**: HS256
- **Expiration**: 24 jam
- **Secret Key**: Environment variable (jangan hardcode di production)

```typescript
// Production: gunakan env variable
const SECRET_KEY = process.env.SECRET_KEY || 'SUPER_SECRET_KEY';
```

---

## API Security

### Authorization Header
Semua request ke protected endpoint harus menyertakan:
```
Authorization: Bearer <token>
```

### Input Validation
Semua input divalidasi dengan Zod schema sebelum diproses:

```typescript
const schema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
});

app.post('/auth/login', zValidator('json', schema), async (c) => {
  // Input sudah tervalidasi
});
```

### Error Handling
- Jangan expose stack trace di production
- Return generic error messages untuk 500 errors
- Log detail error di server side

---

## CORS Configuration

```typescript
app.use('*', cors({
  origin: ['http://localhost:5173'], // Frontend origin
  credentials: true,
}));
```

**Production**: Update origin ke domain production.

---

## Data Security

### Sensitive Data
| Data | Protection |
|------|------------|
| Password | Bcrypt hashed |
| Token | JWT signed |
| Customer phone | Tidak di-expose di list |

### SQL Injection Prevention
Drizzle ORM menggunakan parameterized queries:
```typescript
// Safe - parameterized
db.select().from(users).where(eq(users.id, userId));

// Tidak menggunakan raw SQL kecuali diperlukan
```

---

## Role-Based Access Control (RBAC)

### Roles
| Role | Level |
|------|-------|
| admin | Full access |
| teknisi | Limited (service only) |
| kasir | Limited (sales only) |

### Middleware Example
```typescript
function requireRole(roles: string[]) {
  return async (c: Context, next: Next) => {
    const user = c.get('user');
    if (!roles.includes(user.role)) {
      return c.json({ error: 'Forbidden' }, 403);
    }
    await next();
  };
}

// Usage
app.delete('/users/:id', requireRole(['admin']), async (c) => {
  // Only admin can access
});
```

---

## Session Management

### Token Storage (Frontend)
```typescript
// Store
localStorage.setItem('token', token);

// Retrieve
const token = localStorage.getItem('token');

// Clear on logout
localStorage.removeItem('token');
```

### Auto Logout
- Token expired → redirect to login
- 401 response → clear token & redirect

---

## Security Checklist

### Development
- [ ] Gunakan HTTPS di production
- [ ] Set `SECRET_KEY` dari environment variable
- [ ] Jangan commit `.env` file
- [ ] Validasi semua input

### Production
- [ ] Update CORS origin
- [ ] Set secure cookie flags
- [ ] Enable rate limiting
- [ ] Enable request logging
- [ ] Regular security updates

---

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SECRET_KEY` | JWT signing secret | ✅ Production |
| `DATABASE_URL` | Database path | ❌ Optional |

**`.env` example:**
```env
SECRET_KEY=your-super-secret-key-here
DATABASE_URL=./data/store.db
```

> ⚠️ Never commit `.env` file to version control!
