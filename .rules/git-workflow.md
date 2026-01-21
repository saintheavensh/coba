# Git Workflow

## Commit Message Format

```
<type>: <description>

<optional body>
```

Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`

## Feature Implementation Workflow

1.  **Plan First**: Create an `implementation_plan.md`.
2.  **TDD Approach**: Write tests first (Red), then implement (Green).
3.  **Code Review**: Self-review for security and style.
4.  **Commit**: Use descriptive messages.

## Pull Request / Merge Workflow

1.  Analyze full commit history.
2.  Check for ignored files or accidental inclusions.
3.  Ensure tests pass.
