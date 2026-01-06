# Frontend Guidelines: TanStack Query & Reusability

## TanStack Query vs Axios

You asked: *"Bukankah kita tadi setuju untuk menggunakan tanstack query apakah di gabungkan dengan axios apa bagian khusus saja yang di handle axios ?"*

**Answer:** 
We use **BOTH**, but for different purposes. This is standard industry practice.

1.  **Axios** is the **Transport Layer**.
    *   It handles the actual HTTP request (GET, POST, PUT, DELETE).
    *   It manages headers (Auth Tokens) and global error handling (401 Unauthorized).
    *   It does NOT manage state or caching.

2.  **TanStack Query** is the **Async State Manager**.
    *   It calls Axios to get data.
    *   It caches the result, handles `isLoading`, `isError`, and auto-refetches data.
    *   It replaces `useEffect` / `onMount` data fetching logic.

**Example Flow:**
`Component` -> `TanStack Query (createQuery)` -> `Service` -> `Axios` -> `Backend API`

## Data Fetching & Response Handling
Since we migrated to a **Standard API Response** format, all Backend endpoints return:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... } // or [ ... ]
}
```

Therefore, your **Frontend Services** (`src/lib/services/*.ts`) MUST unpack this response before returning to the UI component.
**Correct Pattern:**
```typescript
getProducts: async () => {
    const res = await api.get("/inventory");
    // ALWAYS unwrap data found in res.data.data
    // Fallback to res.data only for legacy endpoints (if any)
    return res.data?.data || res.data;
}
```

This ensures the Component receives the actual data array/object, not the wrapper.

This ensures the Component receives the actual data array/object, not the wrapper.

## Reactivity: Svelte 5 Runes (MANDATORY)
To avoid reactivity issues (e.g. data not updating after reload or mutation), you **MUST** use Svelte 5 Runes (`$state`, `$derived`) instead of the legacy `let` / `$:` syntax.

### Why?
Legacy syntax can fail to track deep reactivity updates from TanStack Query during hydration. Runes satisfy fine-grained reactivity required for robust UI updates.

### Pattern
**❌ DO NOT USE (Legacy):**
```svelte
<script>
    let searchTerm = ""; // ❌
    $: products = query.data || []; // ❌ Often misses updates
</script>
```

**✅ DO USE (Runes):**
```svelte
<script>
    // State
    let searchTerm = $state(""); 

    // Derived Data (Auto-updates when query data changes)
    let products = $derived(query.data || []);
    let isLoading = $derived(query.isLoading);

    // Derived Filtered Data
    let filtered = $derived(products.filter(p => p.name.includes(searchTerm)));
</script>
```

## Reducing Redundancy (DRY)

We are actively refactoring common UI elements into reusable components.

### 1. `SearchInput`
Instead of repeating the semantic HTML for a search bar with an icon, imports, and styling in every file, use:

```svelte
<script>
    import SearchInput from "$lib/components/custom/search-input.svelte";
    let term = "";
</script>

<SearchInput bind:value={term} placeholder="Cari..." />
```

### 2. Services
Always encapsulate API calls in `$lib/services/*`. Do not call `api.get()` directly in `.svelte` files if possible. This ensures reuse across different pages (e.g. `InventoryService.getProducts` used in `product-list`, `sales`, and `purchase-list`).

### 3. Shared ShadCN Components
We utilize the `components/ui` folder for atomic components (Button, Input, Dialog). Do not re-implement these styles manually.

## General Coding Standards
Refer to `docs/development-standards.md` for detailed rules regarding:
- **Clean Code** (DRY, SOLID)
- **Naming Conventions** (camelCase, PascalCase, kebab-case)
- **Type Safety** (No `any`, use Interfaces)
- **Documentation** (JSDoc, descriptive commits)
