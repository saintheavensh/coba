---
description: Aturan dan batasan yang harus diikuti saat mengerjakan project ini
---

# Project Rules

## Inventory Module

### Struktur Data
- `products` = Katalog (nama, kode, kategori). Stok agregat.
- `product_batches` = Stok aktual (qty, harga, varian).
- `variant` = Field TEXT di batch, bukan tabel terpisah.

### Aturan Ketat
1. Stok masuk HANYA via Menu Pembelian
2. Varian adalah teks bebas (Original, OEM, Copy)
3. Tidak ada tabel `brands` atau `variants`
4. FIFO untuk stok keluar

### Alur Pembelian
```
Supplier → Produk → Varian (ketik) → Qty & Harga → Submit
```

## Service Module

### Status Flow
```
antrian → dicek → konfirmasi → dikerjakan → selesai → diambil
                     ↓
                   batal
```

### Data JSON
- `customer`: { name, phone, address }
- `device`: { brand, model, imei, equipment }

## General Rules

- Semua ID menggunakan format: `PREFIX-TIMESTAMP` atau `PREFIX-XXX`
- Gunakan Zod untuk validasi
- Error handling dengan try-catch
- Log aktivitas penting ke `activity_logs`
