# Project Guidelines & Governance

This document serves as the central source of truth for all development standards in this project.

## 📚 Rule Registry

| Category | File | Description |
|----------|------|-------------|
| **Security** | [.rules/security.md](.rules/security.md) | **MANDATORY**: Secrets, Validation, AuthZ. |
| **Code Style** | [.rules/coding-style.md](.rules/coding-style.md) | Immutability, Naming, Best Practices. |
| **Backend** | [.rules/backend-patterns.md](.rules/backend-patterns.md) | Hono.js, Drizzle ORM. |
| **Frontend** | [.rules/frontend-patterns.md](.rules/frontend-patterns.md) | Svelte 5, Runes, Tailwind CSS. |
| **Testing** | [.rules/testing.md](.rules/testing.md) | TDD Workflow, 80% Coverage. |
| **Refactoring** | [.rules/refactoring.md](.rules/refactoring.md) | Code Smells, Workflow. |
| **Git** | [.rules/git-workflow.md](.rules/git-workflow.md) | Commit messages, PR process. |

## � Agent Skills

Use these specialized skills for complex tasks. Read the `SKILL.md` file before starting.

| Skill | Path | Description |
|-------|------|-------------|
| **TDD Workflow** | [.agent/skills/tdd-workflow/SKILL.md](.agent/skills/tdd-workflow/SKILL.md) | Step-by-step TDD with Vitest/Svelte. |
| **Security Review** | [.agent/skills/security-review/SKILL.md](.agent/skills/security-review/SKILL.md) | Security checklist for Hono/Drizzle. |

## 🤖 Agent Persona & Protocol

1.  **Consult this document** at the start of complex tasks.
2.  **Verify security** implications before writing any code.
3.  **Follow the TDD loop**: Tests first.
4.  **Use the defined patterns** for Backend and Frontend.
