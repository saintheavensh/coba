---
description: Aturan project, langkah sebelum implementasi, dan standar coding
---

# Project Guidelines

Dokumen ini menggabungkan semua aturan dan panduan yang harus diikuti sebelum dan selama implementasi fitur.

---

## 📚 Langkah Wajib Sebelum Implementasi

### 1. Baca Dokumentasi

| Dokumen | Deskripsi |
|---------|-----------|
| [01_PRD.md](../docs/01_PRD.md) | **WAJIB** - Product Requirements |
| [02_Architecture.md](../docs/02_Architecture.md) | Arsitektur Sistem |
| [03_Frontend.md](../docs/03_Frontend.md) | Panduan Svelte 5 |
| [04_Backend.md](../docs/04_Backend.md) | Panduan HonoJS |
| [05_Database.md](../docs/05_Database.md) | Schema Database |
| [06_API_Reference.md](../docs/06_API_Reference.md) | API Endpoints |

### 2. Pahami Konsep Utama

- **Produk vs Batch**: Stok ada di `product_batches`, Produk hanya template
- **FIFO**: Penjualan memotong stok dari batch tertua (`createdAt ASC`)
- **Staged Returns**: Barang rusak → `defective_items` → Retur ke Supplier
- **Stok Masuk**: HANYA via Pembelian (`purchases`)
- **Stok Keluar**: Via Penjualan (FIFO) atau Retur

### 3. Aturan yang Tidak Boleh Dilanggar

- ❌ JANGAN buat tabel `brands` atau `variants` terpisah
- ❌ JANGAN input stok manual (harus via pembelian)
- ❌ JANGAN relasikan merk ke kategori atau supplier
- ✅ Varian = field TEXT di `product_batches`

---

## 📦 Business Logic per Module

### Inventory
```
products      → Katalog (nama, kode, kategori)
product_batches → Stok aktual (qty, harga, varian)
```

### Purchases (Stok Masuk)
```
Supplier → Produk → Varian → Qty & Harga → Submit → Batch baru
```

### Sales (Stok Keluar)
```
Produk → Varian → FIFO batch → Qty → Payment → Stok berkurang
```

### Service Center
```
[antrian] → [dicek] → [konfirmasi] → [dikerjakan] → [selesai] → [diambil]
                           └──────────────────────────────────→ [batal]
```

### Customer Debt
```
creditLimit: Batas hutang | debt: Total saat ini
Validasi: debt + newDebt <= creditLimit
```

---

## 📐 Coding Standards

### ID Format

| Entity | Prefix | Example |
|--------|--------|---------|
| User | `USR-` | `USR-A1B2C3D4` |
| Customer | `CUST-` | `CUST-E5F6G7H8` |
| Product | `PRD-` | `PRD-I9J0K1L2` |
| Supplier | `SUP-` | `SUP-M3N4O5P6` |
| Purchase | `PO-` | `PO-Q7R8S9T0` |
| Sale | `SAL-` | `SAL-U1V2W3X4` |
| Batch | `B-` | `B-Y5Z6A7B8` |
| Category | `CAT-` | `CAT-C1D2E3F4` |
| Return | `RET-` | `RET-G5H6I7J8` |
| Defective | `DEF-` | `DEF-K9L0M1N2` |

### Backend Pattern

```typescript
// Controller → Service → Repository
app.post("/", zValidator("json", schema), async (c) => {
    const data = c.req.valid("json");
    const result = await service.create(data);
    return apiSuccess(c, result, "Created", 201);
});
```

### Frontend Pattern

```svelte
<script lang="ts">
    let name = $state("");
    let items = $derived(query.data || []);
    
    const query = createQuery(() => ({
        queryKey: ["items"],
        queryFn: () => ItemService.getAll(),
    }));
</script>
```

### Validation & Types
- Gunakan **Zod** untuk semua validasi
- Gunakan **types dari `@repo/shared`** untuk konsistensi
- Error handling dengan `try-catch` dan `HTTPException`

---

## 🗂️ Referensi Cepat

| Resource | Path |
|----------|------|
| Shared Types | `packages/shared/types.ts` |
| Database Schema | `apps/backend/src/db/schema.ts` |
| API Controllers | `apps/backend/src/modules/*/` |
| Frontend Routes | `apps/frontend/src/routes/` |
| Frontend Services | `apps/frontend/src/lib/services/` |
| ID Generator | `apps/backend/src/lib/utils.ts` |

---

## 🔒 TypeScript Rules

### Hindari `any`
- ❌ JANGAN gunakan `any` kecuali benar-benar tidak bisa dihindari
- ✅ Gunakan types dari `@repo/shared` untuk semua entity
- ✅ Gunakan `unknown` + type guard jika perlu handle data dinamis
- ✅ Gunakan generic types untuk fungsi yang reusable

### Contoh yang Benar

```typescript
// ❌ SALAH
function processData(data: any) { ... }

// ✅ BENAR - Gunakan shared type
import type { Customer, Product } from "@repo/shared";
function processCustomer(data: Customer) { ... }

// ✅ BENAR - Gunakan generic
function apiSuccess<T>(c: Context, data: T, message: string) { ... }

// ✅ BENAR - Gunakan unknown + type guard
function handleError(error: unknown) {
    if (error instanceof Error) {
        console.error(error.message);
    }
}
```

### Import Types
```typescript
// Backend
import type { Customer, Product, Sale } from "@repo/shared";
import { ID_PREFIXES, type IdPrefix } from "@repo/shared";

// Frontend  
import type { Customer, ApiResponse } from "@repo/shared";
```

---

## ✅ Checklist

### Sebelum Implementasi
- [ ] Sudah baca PRD
- [ ] Sudah baca Database Schema
- [ ] Sudah paham Controller/Service/Repository pattern
- [ ] Sudah paham Svelte 5 Runes

### Sebelum Commit
- [ ] Tidak ada hardcoded values
- [ ] Semua validasi menggunakan Zod
- [ ] ID menggunakan `generateId()` dari utils
- [ ] Types menggunakan `@repo/shared`
- [ ] Tidak membuat tabel brands/variants
- [ ] **Tidak menggunakan `$:` reactive statements**

---

## 🚀 Svelte 5 Runes (WAJIB)

> **PENTING**: Project ini menggunakan Svelte 5. JANGAN gunakan sintaks Svelte 4.

### Aturan Utama
- ❌ **JANGAN** gunakan `$:` reactive statements
- ❌ **JANGAN** gunakan `export let` untuk props
- ❌ **JANGAN** gunakan `let variable = value` untuk state yang berubah
- ✅ **GUNAKAN** `$state()` untuk reactive state
- ✅ **GUNAKAN** `$derived()` untuk computed values
- ✅ **GUNAKAN** `$effect()` untuk side effects
- ✅ **GUNAKAN** `$props()` untuk component props
- ✅ **GUNAKAN** `$bindable()` untuk two-way binding

### Cheat Sheet: Svelte 4 → Svelte 5

| Svelte 4 | Svelte 5 |
|----------|----------|
| `let count = 0` | `let count = $state(0)` |
| `$: doubled = count * 2` | `let doubled = $derived(count * 2)` |
| `$: console.log(count)` | `$effect(() => console.log(count))` |
| `$: if (condition) { ... }` | `$effect(() => { if (condition) {...} })` |
| `export let value` | `let { value } = $props()` |
| `export let value = 0` | `let { value = 0 } = $props()` |

### Contoh Lengkap

#### State Management
```svelte
<script lang="ts">
    // ❌ SALAH (Svelte 4)
    let name = "";
    let items = [];
    
    // ✅ BENAR (Svelte 5)
    let name = $state("");
    let items = $state<Item[]>([]);
</script>
```

#### Derived/Computed Values
```svelte
<script lang="ts">
    let cart = $state<CartItem[]>([]);
    
    // ❌ SALAH (Svelte 4)
    $: total = cart.reduce((sum, item) => sum + item.price, 0);
    $: isEmpty = cart.length === 0;
    
    // ✅ BENAR (Svelte 5)
    let total = $derived(cart.reduce((sum, item) => sum + item.price, 0));
    let isEmpty = $derived(cart.length === 0);
</script>
```

#### Side Effects
```svelte
<script lang="ts">
    let count = $state(0);
    
    // ❌ SALAH (Svelte 4)
    $: console.log("Count changed:", count);
    $: if (count > 10) { alert("High!"); }
    
    // ✅ BENAR (Svelte 5)
    $effect(() => {
        console.log("Count changed:", count);
    });
    
    $effect(() => {
        if (count > 10) {
            alert("High!");
        }
    });
</script>
```

#### Component Props
```svelte
<script lang="ts">
    // ❌ SALAH (Svelte 4)
    export let title: string;
    export let count = 0;
    
    // ✅ BENAR (Svelte 5)
    interface Props {
        title: string;
        count?: number;
        class?: string;
    }
    
    let { title, count = 0, class: className = "" }: Props = $props();
</script>
```

#### Two-Way Binding
```svelte
<script lang="ts">
    interface Props {
        value: number;
    }
    
    let { value = $bindable(0) }: Props = $props();
    
    // Now parent can use: <Component bind:value={someState} />
</script>
```

#### TanStack Query dengan Svelte 5
```svelte
<script lang="ts">
    import { createQuery, createMutation, useQueryClient } from "@tanstack/svelte-query";
    import { CustomersService } from "$lib/services/customers.service";
    
    const client = useQueryClient();
    
    // Query
    const customersQuery = createQuery(() => ({
        queryKey: ["customers"],
        queryFn: () => CustomersService.getAll(),
    }));
    
    // ✅ BENAR: Gunakan $derived untuk data dari query
    let customers = $derived(customersQuery.data || []);
    let isLoading = $derived(customersQuery.isPending);
    
    // Computed dari query data
    let activeCustomers = $derived(
        customers.filter(c => c.debt === 0)
    );
    
    // Mutation
    const createMutation = createMutation(() => ({
        mutationFn: CustomersService.create,
        onSuccess: () => {
            client.invalidateQueries({ queryKey: ["customers"] });
        },
    }));
</script>
```

### Event Handlers

```svelte
<!-- ❌ SALAH (Svelte 4) -->
<button on:click={handleClick}>Click</button>
<input on:input={handleInput} />

<!-- ✅ BENAR (Svelte 5) -->
<button onclick={handleClick}>Click</button>
<input oninput={handleInput} />
```

### Snippet (Pengganti Slots)

```svelte
<script lang="ts">
    import type { Snippet } from "svelte";
    
    interface Props {
        children: Snippet;
        header?: Snippet;
    }
    
    let { children, header }: Props = $props();
</script>

{#if header}
    {@render header()}
{/if}

{@render children()}
```
