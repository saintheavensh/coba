---
description: Project guidelines and standards for this workspace
---

# Project Guidelines

This project follows strict standards for Security, Code Style, and Architecture.
Before starting any task, you should briefly check `PROJECT_GUIDELINES.md` and the relevant `.rules/` file.

**Key Rules:**
1.  **Hono & Drizzle** for Backend.
2.  **Svelte 5** (Runes) for Frontend.
3.  **No Hardcoded Secrets**.
4.  **TDD**: Tests first.
5.  **Validation**: Zod for everything.

**Project Structure:**
- `apps/backend`: Hono server
- `apps/frontend`: Svelte kit/vite app
- `packages/shared`: Shared types/utils

**Commands:**
- `/check-rules`: Review `PROJECT_GUIDELINES.md`
- `/security-check`: Review `.rules/security.md`
