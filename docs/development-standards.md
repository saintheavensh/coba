# Development Standards & Rules

## 1. Standar Respon API (JSON)
Semua fungsi yang menangani respon API harus mengikuti struktur konsisten berikut:

### Format Sukses
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "meta": { ... }
}
```

### Format Error
```json
{
  "success": false,
  "message": "Error description",
  "errors": [],
  "error_code": "ERROR_CODE_STRING"
}
```

### Aturan Tambahan
- **Key Casing**: Gunakan `camelCase` untuk semua key dalam JSON.
- **HTTP Status Code**: Gunakan kode yang sesuai logika bisnis:
  - `200`: OK
  - `201`: Created
  - `400`: Bad Request (Validasi gagal)
  - `401`: Unauthorized (Token tidak valid/tidak ada)
  - `403`: Forbidden (Tidak punya hak akses)
  - `404`: Not Found
  - `500`: Internal Server Error

## 2. Prinsip Coding
- **Clean Code**: Terapkan prinsip **DRY** (Don't Repeat Yourself) dan **SOLID**.
- **Naming Convention**:
    - Variabel & Fungsi: `camelCase`
    - Class & Komponen: `PascalCase`
    - File/Folder: `kebab-case`
- **Type Safety**:
    - Selalu gunakan **TypeScript**.
    - **Hindari** penggunaan `any`.
    - Definisikan `Interface` atau `Type` untuk setiap objek data.

## 3. Dokumentasi & Komentar
- **Komentar**: Tulis hanya untuk logika yang kompleks atau tidak jelas ("Why", bukan "What").
- **JSDoc**: Dokumentasikan fungsi utama, parameter, dan return value.
- **Commit Message**: Gunakan format deskriptif:
    - `feat:` fitur baru
    - `fix:` perbaikan bug
    - `refactor:` perubahan kode tanpa ubah perilaku
    - `chore:` maintenance, config, dll.

## 4. Penanganan Error
- Gunakan blok `try-catch` di level **Service** atau **Controller**.
- **JANGAN** pernah mengirimkan stack trace mentah ke client dalam mode produksi.
- Log error ke konsol atau sistem monitoring dengan detail yang cukup untuk debugging debug.

## 5. Prosedur Interaksi AI
- Selalu berikan kode yang lengkap atau instruksi modifikasi yang jelas (diff).
- **Rencana Dulu**: Sebelum menulis kode besar, jelaskan rencana implementasi secara singkat untuk persetujuan user.
- **Dependensi Baru**: Jika ada library/package baru yang perlu diinstal, informasikan terlebih dahulu.
