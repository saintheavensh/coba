---
description: Sebelum implementasi fitur apapun, baca file ini dan dokumentasi terkait
---

# Workflow: Sebelum Implementasi

## Langkah Wajib

1. **Baca dokumentasi di folder `docs/`** sebelum menulis kode:
   - `docs/overview.md` - Arsitektur & tujuan
   - `docs/development-standards.md` - Standar Coding, API & Rules (**WAJIB BACA**)
   - `docs/database.md` - Schema & relasi tabel
   - `docs/inventoryflow.md` - Alur inventori
   - `docs/serviceflow.md` - Alur servis
   - `docs/auth.md` - Sistem Autentikasi
   - `docs/backend.md` - Dokumentasi API & Backend
   - `docs/frontend.md` - Arsitektur Frontend
   - `docs/frontend-guidelines.md` - Panduan & Best Practices Frontend
   - `docs/folderstructure.md` - Struktur Direktori Project
   - `docs/security.md` - Standar Keamanan
   - `docs/techstack.md` - Teknologi yang digunakan
   - `docs/purchases_module.md` - Dokumentasi teknis & Logic Purchases (**Fix & Limit**)

2. **Pahami konsep utama:**
   - **Produk**: Template barang (nama, kategori). Stok = 0 saat dibuat.
   - **Varian**: Teks bebas (Original, OEM, Copy). Dibuat saat pembelian.
   - **Batch**: Unit stok aktual dengan harga. FIFO.
   - **Stok masuk**: Hanya via Menu Pembelian.

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
