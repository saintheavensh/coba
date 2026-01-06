# Tech Stack

## Core
- **Runtime**: [Bun](https://bun.sh) (v1.x) - Fast JavaScript runtime & package manager.
- **Monorepo Tool**: [Turborepo](https://turbo.build) - High-performance build system.
- **Language**: [TypeScript](https://www.typescriptlang.org/) (v5.x) - Static typing.

## Backend (`apps/backend`)
- **Framework**: [Hono](https://hono.dev/) - Blazing fast web framework.
- **Database**: SQLite (via `bun:sqlite`).
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/) - Type-safe SQL.
- **Validation**: [Zod](https://zod.dev/) - Schema validation.
- **Auth**: JWT (JSON Web Tokens) + Bcrypt.
- **Architecture**: Modular Feature-based (Controller-Service-Repository).

## Frontend (`apps/frontend`)
- **Frontend Framework**: Svelte 5 (Runes Mode) + Kit
  - *Reasoning*: Best-in-class performance and DX. Runes provide robust fine-grained reactivity.
- **State Management**: TanStack Query v5 + Svelte 5 Runes
  - *Reasoning*: Query handles async server state. Runes handle local UI state.
- **Icons**: [Lucide Svelte](https://lucide.dev/).
- **State**: Svelte Runes.
- **Toast**: `svelte-sonner`.

## Shared (`packages/shared`)
- **Schema**: Zod schemas shared between Frontend and Backend types.
- **Types**: Shared TypeScript interfaces.

## Dev Tools
- **Linting**: Biome / ESLint.
- **Formatting**: Prettier.
- **Database GUI**: Drizzle Studio (`bun run db:studio`).
