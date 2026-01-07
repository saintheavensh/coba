# Core Concepts & Business Logic

Dokumen ini berisi penjelasan detail mengenai logika bisnis inti aplikasi. **WAJIB DIPAHAMI** oleh developer (termasuk AI) sebelum melakukan perubahan kode.

---

## 1. Konsep Inventaris (Inventory Model)

Aplikasi ini menggunakan sistem **FIFO (First-In-First-Out) Batch-based Inventory**.

### Entitas Utama
1.  **Product (`products`)**:
    *   Template/Master data (Contoh: "LCD Samsung A54").
    *   Menyimpan total stok (`stock`) untuk keperluan display cepat.
    *   **PENTING**: Jangan pernah menambah stok produk secara langsung tanpa melalui Batch.

2.  **Product Batch (`product_batches`)**:
    *   Unit stok aktual. Setiap kali ada pembelian (Restock), batch baru dibuat.
    *   Attributes: `sku`, `variant` (Original/OEM/etc), `buyPrice`, `sellPrice`, `currentStock`.
    *   **Logika FIFO**: Saat penjualan terjadi, sistem akan mengurangi stok dari batch *tertua* (yang masih memiliki stok > 0).

3.  **Supplier & Category**:
    *   Produk terikat pada Kategori.
    *   Batch terikat pada Supplier dan Produk.

### Aturan Stok
*   ✅ **Stock In (Masuk)**: HANYA boleh melalui **Pembelian (Purchase)**.
*   ✅ **Stock Out (Keluar)**: Melalui **Penjualan (Sales)** atau **Retur (Staging)** -> Pengurangan stok terjadi pada level Batch.
*   ❌ **DILARANG**: Mengedit kolom `stock` di tabel `products` secara manual. Selalu update via transaksi batch.

---

## 2. Alur Retur Pembelian (Staged Return Flow)

Retur Pembelian menggunakan konsep **Staging Area** ("Gudang Retur") untuk memisahkan proses pencatatan barang rusak dengan pembuatan dokumen retur ke supplier.

### Phase 1: Pencatatan Barang Rusak (Staging)
*   **User Action**: Menu "Gudang Retur" -> "Tambah Manual".
*   **Logic**:
    1.  User memilih Produk dan Batch spesifik (sumber barang).
    2.  System memvalidasi stok batch.
    3.  **Action**: Stok Batch **DIKURANGI LANGSUNG** saat disimpan ke Gudang Retur.
    4.  Record disimpan di tabel `defective_items` dengan status `PENDING`.

### Phase 2: Pembuatan Dokumen Retur (Processing)
*   **User Action**: Menu "Gudang Retur" -> Pilih Item -> "Proses Retur".
*   **Logic**:
    1.  User memilih beberapa item (bisa beda produk, tapi HARUS **Satu Supplier**).
    2.  System membuat record `purchase_returns`.
    3.  System mengupdate status `defective_items` menjadi `PROCESSED`.
    4.  Dokumen retur tercipta sebagai bukti fisik/arsip.

---

## 3. Penjualan (Point of Sales)
*   Menggunakan sistem Keranjang (Cart).
*   **Proses Checkout**:
    1.  Validasi stok total.
    2.  Iterasi item di keranjang.
    3.  Untuk setiap item, cari batch tertua (`orderBy: asc createdAt`).
    4.  Kurangi stok batch tersebut. Jika stok batch habis, lanjut ke batch berikutnya (Split Batch Deduct).
    5.  Rekam `sale_items` dengan referensi ke `product_id` (bukan batch, untuk simplifikasi reporting penjualan, namun pengurangan stok tetap di batch). 
    *   *Note: Idealnya sale_items track batch_id jika butuh traceability ketat, saat ini logika FIFO di handle di service layer.*

---

## 4. Universal SKU & Barcode
*   **Universal SKU**: Setiap produk memiliki kode unik (e.g. `PRD-001`).
*   **Batch SKU**: Setiap batch bisa memiliki kode spesifik jika perlu, namun pencarian utama berbasis Produk.

---

## 5. Struktur Sidebar & UX
*   **Dashboard**: Overview.
*   **Manajemen** (Master Data): Produk, Kategori, Supplier, Customer.
*   **Transaksi** (Operasional Harian):
    *   **Penjualan**: Kasir & History.
    *   **Pembelian**: Restock & Retur.
    *   **Service**: Tracking perbaikan.
*   **Laporan**: Analisa.
*   **Pengaturan**: Konfigurasi sistem.

---

## 6. Technical Constraints (AI Context)
*   **Backend**: Hono.js + Drizzle ORM (SQLite).
*   **Frontend**: SvelteKit 5 + Shadcn-Svelte + Tailwind.
*   **State Management**: Svelte Runes (`$state`, `$derived`).
*   **Fetching**: TanStack Query.
*   **Validation**: Zod.
