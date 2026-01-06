# Purchase Module Documentation

> [!IMPORTANT]
> **STATUS: FIXED / STABLE**
> Fitur ini telah difinalisasi pada 7 Januari 2026. Logika inti (terutama Filter Tanggal) **TIDAK BOLEH DIUBAH** tanpa alasan yang sangat mendesak.

## Overview
Modul Purchase menangani "Stock In" (Barang Masuk) dari Supplier. Modul ini tidak hanya mencatat transaksi pembelian tetapi juga secara otomatis menambah stok produk melalui mekanisme Batching.

## Fitur Utama

### 1. Custom Date & Time Picker
Menggunakan komponen `DateTimePicker.svelte` custom yang mengadopsi gaya **Shadcn UI**.
- **Fitur**: Kalender intuitif + Kolom seleksi jam (Scrollable).
- **Default**: Tanggal & Jam saat ini.
- **Reactivity**: Sinkronisasi otomatis dengan state form menggunakan Svelte 5 runes (`$state`) yang kompatibel dengan legacy syntax.

### 2. Supplier Profile Card
UI pemilihan supplier direvamp menjadi bentuk **Kartu Profil**:
- Menampilkan Ikon Toko, Telepon, dan Lokasi.
- Memberikan feedback visual yang jelas tentang supplier yang dipilih.

### 3. Recent History (Riwayat Input)
Tabel riwayat input yang muncul di bawah form input.
- **Limit**: Dibatasi menampilkan **3 transaksi terakhir** saja untuk menjaga kerapian UI.
- **Auto-Refresh**: Tabel otomatis diperbarui setiap kali user berhasil melakukan input atau mengganti tanggal filter.

---

## Technical Logic (DO NOT MODIFY)

Bagian ini mendokumentasikan logika "Fixed" yang menjamin data muncul dengan benar.

### 1. Date Filter Logic (Timezone Handling)
Masalah utama yang sering terjadi adalah ketidakcocokan antara Timezone Lokal User (WIB) dengan Server/Database (UTC).

**Solusi Final (Frontend):**
Saat merequest data history untuk tanggal tertentu, kita mengirimkan parameter `startDate` yang mewakili **Awal Hari (00:00)** waktu lokal user, dikonversi ke UTC.

```typescript
// purchases/new/+page.svelte

// 1. Ambil input tanggal lokal dari user
const d = new Date(date); 

// 2. Set ke jam 00:00:00.000 waktu LOKAL
d.setHours(0, 0, 0, 0); 

// 3. Konversi ke ISO String (UTC) untuk dikirim ke Backend
// Contoh: 00:00 WIB -> 17:00 UTC (Hari Sebelumnya)
const isoStart = d.toISOString();

// 4. Request API
api.get(`/purchases?mine=true&startDate=${isoStart}&limit=3`);
```

**Solusi Final (Backend):**
Database menyimpan tanggal sebagai `INTEGER` (Timestamp MS), namun Drizzle ORM memappingnya sebagai `Date`.

**PENTING**: Jangan gunakan raw SQL (`sql`${col} >= ${val}`) karena rentan error tipe data (String vs Integer). Gunakan operator Drizzle (`gte`, `lte`).

```typescript
// purchases.repository.ts

if (filters?.startDate) {
    // Gunakan operator gte (Greater Than or Equal)
    // Drizzle otomatis menangani konversi Date -> Integer DB
    conditions.push(gte(purchases.date, filters.startDate));
}
```

### 2. Limit Logic
Limitasi jumlah baris dilakukan di Backend Repository level, bukan memotong array di Frontend.
```typescript
// purchases.repository.ts
db.query.purchases.findMany({
    // ...
    limit: filters?.limit, // Parameter limit diteruskan dari Controller
    // ...
})
```

---

## Alur Data (Flow)

1. **User Memilih Supplier**: Dropdown supplier dengan pencarian.
2. **Setup Tanggal**: Default "Now".
3. **Input Item**: User memasukkan Item, Varian (bisa custom), Harga Beli, dan Qty.
4. **Submit**:
   - `POST /purchases` dikirim ke backend.
   - Backend membuat **Purchase Header**.
   - Backend membuat/update **Product Batch**.
   - Backend menambah **Product Stock**.
   - Backend mencatat **Activity Log**.
5. **Post-Submit**:
   - Form di-reset (kecuali Supplier & Tanggal).
   - Toast "Success" muncul.
   - Tabel "Recent History" refresh otomatis.

## File Struktur Terkait

- **Frontend**:
    - `routes/purchases/new/+page.svelte` (Halaman Utama)
    - `lib/components/custom/date-time-picker.svelte` (Komponen Tanggal)
- **Backend**:
    - `modules/purchases/purchases.controller.ts` (Parsing Params)
    - `modules/purchases/purchases.service.ts` (Transaksi DB)
    - `modules/purchases/purchases.repository.ts` (Query & Filtering)
