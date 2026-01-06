# Frontend Documentation

## Pages Overview

| Route | Page | Description |
|-------|------|-------------|
| `/` | Dashboard | Statistik, grafik, aktivitas terbaru |
| `/login` | Login | Form login user |
| `/logout` | Logout | Logout & redirect |
| `/service` | Service List | Daftar order servis |
| `/service/[id]` | Service Detail | Detail & aksi servis |
| `/products` | Products | Tabs: Produk, Kategori, Supplier |
| `/purchases` | Purchases | Daftar pembelian |
| `/purchases/new` | New Purchase | Form pembelian baru |
| `/sales` | POS | Point of Sales |
| `/reports` | Reports | Laporan & analytics |
| `/settings` | Settings | Pengaturan aplikasi |

---

## Layout Structure

### Main Layout (`+layout.svelte`)
```
┌────────────────────────────────────────────────────┐
│  ┌──────────┐  ┌────────────────────────────────┐  │
│  │          │  │ Header (Search, User Menu)     │  │
│  │ Sidebar  │  ├────────────────────────────────┤  │
│  │          │  │                                │  │
│  │ - Dashboard │ │         Page Content        │  │
│  │ - Service │  │                                │  │
│  │ - Products│  │                                │  │
│  │ - Sales   │  │                                │  │
│  │ - Reports │  │                                │  │
│  │ - Settings│  │                                │  │
│  └──────────┘  └────────────────────────────────┘  │
└────────────────────────────────────────────────────┘
```

---

## Page Details

### Dashboard (`/`)
- Statistik cards (total servis, pendapatan, dll)
- Grafik aktivitas
- Servis terbaru
- Stok rendah alert

### Service (`/service`)
- Filter berdasarkan status dan teknisi
- Tabel daftar servis
- Modal tambah servis baru
- Link ke detail servis

### Service Detail (`/service/[id]`)
- Info customer & device
- Timeline status
- Aksi: update status, reassign teknisi
- Tambah sparepart
- WhatsApp integration
- Print label

### Products (`/products`)
**Tab: Produk**
- Daftar produk dengan stok
- Filter kategori
- Modal tambah/edit produk

**Tab: Kategori**
- Daftar kategori
- CRUD kategori

**Tab: Supplier**
- Daftar supplier
- Modal tambah/edit supplier

### Purchases (`/purchases`)
- Daftar purchase order
- Link ke form pembelian baru

### New Purchase (`/purchases/new`)
- Pilih supplier
- Tambah item (produk, varian, qty, harga)
- Submit → auto create batches

### Sales (`/sales`)
- POS interface
- Scan/search produk
- Keranjang
- Checkout

### Settings (`/settings`)
- Pengaturan toko
- Pengaturan garansi
- Manajemen user

---

## Components (shadcn-svelte)

### UI Components Used
| Component | Usage |
|-----------|-------|
| Button | Actions, submit |
| Input | Text fields |
| Textarea | Long text |
| Table | Data tables |
| Card | Stats, containers |
| Badge | Status labels |
| Dialog | Modals |
| Sheet | Side panels |
| Tabs | Tab navigation |
| Avatar | User images |
| Dropdown | Menus |

### Custom Components
| Component | Location | Description |
|-----------|----------|-------------|
| `service-list.svelte` | `/service/components` | Daftar servis |
| `create-service-modal.svelte` | `/service/components` | Modal tambah servis |
| `product-list.svelte` | `/products/components` | Daftar produk |
| `category-list.svelte` | `/products/components` | Daftar kategori |
| `supplier-list.svelte` | `/products/components` | Daftar supplier |

---

## API Integration

### API Helper (`src/lib/api.ts`)
```typescript
export async function api(endpoint: string, options?: RequestInit) {
  const token = localStorage.getItem('token');
  
  const res = await fetch(`http://localhost:4000${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
      ...options?.headers,
    },
  });
  
  if (!res.ok) throw new Error('API Error');
  return res.json();
}
```

### Usage Example
```typescript
// GET
const products = await api('/inventory');

// POST
const result = await api('/inventory', {
  method: 'POST',
  body: JSON.stringify({ name: 'Product' })
});
```

---

## State Management

- **Local State**: Svelte reactive variables (`$state`, `let`)
- **Form State**: Bound to input components
- **Auth State**: LocalStorage (`token`, `user`)
- **Toasts**: svelte-sonner for notifications
