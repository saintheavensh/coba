# Security Guidelines

## Mandatory Security Checks

Before ANY commit:
- [ ] No hardcoded secrets (API keys, passwords, tokens)
- [ ] All user inputs validated (Zod)
- [ ] SQL injection prevention (Drizzle ORM parameters)
- [ ] XSS prevention (Auto-escaping in Svelte)
- [ ] CSRF protection enabled
- [ ] Authentication/authorization verified
- [ ] Rate limiting on public endpoints
- [ ] Error messages don't leak sensitive data

## Secret Management

```typescript
// NEVER: Hardcoded secrets
const apiKey = "sk-proj-xxxxx";

// ALWAYS: Environment variables
// Ensure these are in your .env file
const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  throw new Error('OPENAI_API_KEY not configured');
}
```

## Security Response Protocol

If a security issue is found:
1.  **STOP** immediately.
2.  Fix **CRITICAL** issues before continuing.
3.  Rotate any exposed secrets.
4.  Review entire codebase for similar issues.
