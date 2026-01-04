# Architecture: Monorepo

## Structure
```
root/
├── package.json (Workspaces + Turbo)
├── turbo.json
├── apps/
│   ├── frontend/ (SvelteKit + Tailwind + Shadcn)
│   └── backend/ (Hono.js)
└── packages/ (Shared UI/Config)
```

## Stack
- **Manager**: Bun (Workspaces)
- **Build System**: Turborepo
- **Frontend**: SvelteKit, TailwindCSS v3 (for Shadcn compatibility), Lucide-Svelte
- **Backend**: Hono.js (Standalone)

## Steps
1. Init Monorepo Root
2. Setup Frontend (SvelteKit)
3. Setup Backend (Hono - Placeholder)
4. Configure Turbo Pipeline
