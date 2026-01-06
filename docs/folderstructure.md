# Folder Structure

## Root Directory

```
coba/
├── apps/
│   ├── backend/          # Hono API server
│   └── frontend/         # SvelteKit app
├── packages/
│   └── shared/           # Shared utilities & schemas
├── docs/                 # Documentation
├── .agent/               # AI Workflow configs
├── package.json          # Root package.json
├── turbo.json            # Turborepo config
└── bun.lockb             # Bun lockfile
```

---

## Backend Structure

Based on **Feature-based Module Organization**.

```
apps/backend/
├── data/
│   └── store.db              # SQLite database file (Database)
│
├── src/
│   ├── db/
│   │   ├── index.ts          # Database instance connection
│   │   └── schema.ts         # Drizzle table definitions
│   │
│   ├── modules/              # FEATURE MODULES
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   └── auth.repository.ts
│   │   │
│   │   ├── inventory/        # Products & Batches
│   │   │   ├── inventory.controller.ts
│   │   │   ├── inventory.service.ts
│   │   │   └── inventory.repository.ts
│   │   │
│   │   ├── sales/            # Sales & POS
│   │   │   ├── sales.controller.ts
│   │   │   ├── sales.service.ts
│   │   │   └── sales.repository.ts
│   │   │
│   │   ├── purchases/        # Stock In
│   │   │   ├── purchases.controller.ts
│   │   │   ├── purchases.service.ts
│   │   │   └── purchases.repository.ts
│   │   │
│   │   ├── service/          # Service Orders
│   │   │   ├── service.controller.ts
│   │   │   ├── service.service.ts
│   │   │   └── service.repository.ts
│   │   │
│   │   ├── suppliers/
│   │   │   ├── suppliers.controller.ts
│   │   │   ├── suppliers.service.ts
│   │   │   └── suppliers.repository.ts
│   │   │
│   │   ├── categories/
│   │   │   ├── categories.controller.ts
│   │   │   ├── categories.service.ts
│   │   │   └── categories.repository.ts
│   │   │
│   │   └── notifications/
│   │       ├── notifications.controller.ts
│   │       ├── notifications.service.ts
│   │       └── notifications.repository.ts
│   │
│   ├── middlewares/
│   │   └── auth.middleware.ts  # JWT Auth Guard
│   │
│   └── index.ts              # App entry point & Router registration
│
├── drizzle.config.ts         # Drizzle Kit config
├── package.json
└── tsconfig.json
```

### Architecture Rules
1. **Controller**: Handle HTTP Request/Response, Input Validation, params parsing. *No Business Logic.*
2. **Service**: Handle Business Rules, transactions, calculations, flow. *No DB queries directly (use repo).*
3. **Repository**: Handle DB queries, Drizzle operations. *No Business Logic.*

---

## Frontend Structure

```
apps/frontend/
├── src/
│   ├── lib/
│   │   ├── api.ts            # API fetch wrapper
│   │   ├── utils.ts          # Utility functions (cn)
│   │   └── components/
│   │       └── ui/           # shadcn-svelte components
│   │
│   ├── routes/
│   │   ├── +layout.svelte    # Main layout (sidebar + header)
│   │   ├── +page.svelte      # Dashboard
│   │   │
│   │   ├── login/
│   │   ├── service/
│   │   ├── products/
│   │   ├── purchases/
│   │   ├── sales/
│   │   ├── reports/
│   │   └── settings/
│   │
│   └── app.html
│
├── static/
├── package.json
└── tsconfig.json
```

---

## Shared Package Structure

```
packages/shared/
├── src/
│   └── index.ts          # DB Types & Zod Schemas
├── package.json
└── tsconfig.json
```
