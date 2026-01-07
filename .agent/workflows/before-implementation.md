---
description: Sebelum implementasi fitur apapun, baca file ini dan dokumentasi terkait
---

# Workflow: Sebelum Implementasi

## Langkah Wajib

1. **Baca dokumentasi di folder `docs/`** sebelum menulis kode:
   - `docs/core_concepts.md` - **KNOWLEDGE BASE UTAMA** (Business Logic, Architectures, Essential Flows) - **WAJIB BACA!**
   - `docs/development-standards.md` - Standar Coding, API & Rules
   - `docs/database.md` - Schema & relasi tabel
   - `docs/inventoryflow.md` - Detail Alur inventori
   - `docs/serviceflow.md` - Detail Alur servis

2. **Pahami konsep utama (Detail di `core_concepts.md`):**
   - **Produk vs Batch**: Stok ada di Batch, Produk hanya template.
   - **FIFO**: Penjualan memotong stok dari batch tertua.
   - **Staged Returns (Gudang Retur)**: Barang rusak masuk staging (`defective_items`) -> Baru dibuatkan Retur ke Supplier.
   - **Stok Masuk**: HANYA via Pembelian.
   - **Stok Keluar**: Via Penjualan (FIFO) atau Retur (Batch specific).

3. **Jangan melanggar aturan ini:**
   - ❌ JANGAN buat tabel `brands` atau `variants` terpisah
   - ❌ JANGAN input stok manual (harus via pembelian)
   - ❌ JANGAN relasikan merk ke kategori atau supplier
   - ✅ Varian = field TEXT di tabel `product_batches`

## Alur Pembelian yang Benar

```
1. Pilih Supplier
2. Pilih Produk (semua produk)
3. Input Varian (ketik bebas, bisa autocomplete dari yang sudah ada)
4. Input Qty, Harga Beli, Harga Jual
5. Submit → Batch baru dibuat → Stok bertambah
```

## Referensi Cepat

- Database: `apps/backend/src/db/schema.ts`
- API: `apps/backend/src/routes/`
- Frontend: `apps/frontend/src/routes/`
