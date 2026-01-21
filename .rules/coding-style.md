# Coding Style

## Code Quality Principles
1.  **Readability First**: Clear names > clever code.
2.  **KISS (Keep It Simple)**: Avoid over-engineering.
3.  **DRY (Don't Repeat Yourself)**: Extract common logic.

## Immutability (CRITICAL)
ALWAYS create new objects, NEVER mutate:

```typescript
// WRONG: Mutation
user.name = name;

// CORRECT: Immutability
const newUser = { ...user, name };
```

## File Organization
**MANY SMALL FILES > FEW LARGE FILES**:
- High cohesion, low coupling.
- 200-400 lines typical.
- Extract utilities.

## Anti-Patterns to Avoid
1.  **Deep Nesting**: Use early returns.
2.  **Magic Numbers**: Use named constants.
3.  **Long Functions**: Split functions > 50 lines.

## Error Handling
ALWAYS handle errors comprehensively. Use centralized `logger` and `ApiError`.

## Input Validation
ALWAYS validate user input with **Zod** schema.

## Code Quality Checklist
- [ ] Code is readable.
- [ ] No `console.log`.
- [ ] No hardcoded values.
- [ ] No mutation.
