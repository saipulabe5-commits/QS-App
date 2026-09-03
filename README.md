# RAB Pro V3 - Enterprise Forensic Hardening & Zero-Cost Local-First Architecture

Aplikasi manajemen Rencana Anggaran Biaya (RAB), Quantity Surveying (QS), Cost Estimation, Project Cost Control, dan Property Feasibility berskala enterprise dengan arsitektur **Local-First / Zero-Cost** yang 100% gratis, aman, dan siap deploy.

---

## 1. Arsitektur Inti (Zero-Cost & Local-First)
- **Primary Client Storage**: Menyimpan seluruh data proyek, item RAB, database harga, AHSP, gambar teknis, analisis AI, dan kurva S langsung di peramban pengguna menggunakan **IndexedDB Adapter** (`rabpro_offline_db`) berkapasitas besar tanpa risiko kuota crash.
- **Node.js Express Secure Gateway**: Server bertindak sebagai *security & AI proxy* tanpa ketergantungan database cloud berbayar (biaya hosting database $0).
- **Single Source of Truth**: Seluruh modul (Dashboard, RAB Grid, Laporan, Kurva S, Kelayakan Properti) menggunakan satu mesin kalkulasi terpusat `calculateRAB` dan `reconcileFinancialTotals` pada `src/utils/calculations.ts`.

---

## 2. Keamanan & Forensic Hardening
- **Autentikasi & Password Hashing**: Menggunakan algoritma bawaan Node.js `crypto.scryptSync` dengan salt acak 16-byte (`salt:hash`). Tidak ada kata sandi plain-text yang disimpan.
- **Role-Based Access Control (RBAC)**: Endpoint API memvalidasi role (`administrator`, `estimator`, `viewer`) melalui JWT berdurasi 30 hari.
- **In-Memory Rate Limiting**:
  - Auth: 10 requests/menit/IP
  - AI API: 30 requests/menit/User
  - Source Code Export: 5 requests/menit/Admin
- **Proteksi Source Code**: Endpoint `/api/export/source-code` diisolasi khusus `administrator` dengan proteksi rate limit dan verifikasi token.
- **Security Headers**: Header standar keamanan web aktif (`X-Content-Type-Options: nosniff`, `X-XSS-Protection: 1; mode=block`, `Referrer-Policy: strict-origin-when-cross-origin`).

---

## 3. Integritas Data Kriptografis (SHA-256 Hash Chaining)
- **Audit Trail Imutabel**: Setiap revisi item RAB dicatat dalam rantai hash SHA-256 (`previousHash` -> `payloadHash` -> `currentHash`) pada `RevisionService`.
- **Persistent Device ID**: ID perangkat unik berbasis `crypto.randomUUID()` disimpan di perangkat klien.
- **Backup & Restore Verifikasi Integritas**: Berkas ekspor JSON dilengkapi atribut `integrityHash` SHA-256 deterministik untuk memverifikasi keaslian data sebelum dipulihkan.
- **Penghapusan Berjenjang (Cascade Deletion)**: Menghapus proyek secara otomatis membersihkan seluruh item RAB, berkas gambar, hasil OCR/analisis AI, dan kurva S terkait.

---

## 4. Validasi & Rekonsiliasi Finansial
- **Presisi Tanpa NaN/Infinity**: Fungsi `sanitizeRABItem()` membersihkan input volume atau harga yang bernilai negatif, NaN, atau non-numerik.
- **Toleransi Rekonsiliasi**: `reconcileFinancialTotals()` memverifikasi bahwa:
  $$\text{Direct Cost} + \text{Overhead} + \text{Profit} + \text{PPN (Pajak)} = \text{Grand Total}$$
  dengan deviasi pembulatan $\le 1.0$ Rupiah.

---

## 5. Menjalankan Pengujian Otomatis (Automated Test Suite)
Proyek dilengkapi dengan 31 pengujian otomatis yang mencakup pengujian kalkulasi finansial, sanitasi edge cases, stress test 1.000 item, kriptografi SHA-256, keamanan kata sandi, dan integritas cadangan data.

```bash
# Menjalankan seluruh test suite
npm test

# Menjalankan validasi tipe TypeScript
npm run lint

# Membangun aplikasi produksi
npm run build
```

---

## 6. Panduan Variabel Lingkungan (.env)
```env
ADMIN_EMAIL=saipulabe@gmail.com
ADMIN_INITIAL_PASSWORD=AdminSaipul123!
GEMINI_API_KEY=your_gemini_api_key_here
JWT_SECRET=rab-pro-local-first-enterprise-secret-key-987654321
```
*Catatan: Aplikasi tetap dapat berjalan secara offline dan mandiri (Local-First) meskipun `GEMINI_API_KEY` tidak diisi.*

## Biaya & Batasan Zero-Cost
Aplikasi ini dirancang dengan prinsip **Zero-Cost Local-First**, yang berarti:
- **Gratis Selamanya**: Seluruh fitur utama (kalkulasi RAB, IndexedDB lokal, S-Curve, laporan, export Excel/PDF, dan manajemen proyek) memproses data secara lokal di browser atau server Anda tanpa memakan biaya pihak ketiga.
- **Batasan Kuota AI (Gemini)**: Fitur kecerdasan buatan (RAB Assistant, Parse Dokumen OCR, Analisis Harga) menggunakan kunci API Gemini. Untuk mencegah tagihan membengkak akibat _abuse_ atau _overusage_, aplikasi ini memiliki **Global AI Rate Limiter** bawaan yang membatasi hingga **1.000 request per hari**. Jika kuota habis, fitur AI akan dinonaktifkan sementara hingga hari berikutnya, sedangkan fitur manual tetap dapat digunakan 100% tanpa hambatan.
- **Cloud Run Deployment**: Jika Anda menggunakan Google Cloud Run, pastikan mengkonfigurasi `min-instances = 0` dan `max-instances = 1` agar server ini masuk ke dalam _Free Tier_ Google Cloud, dan tidak menimbulkan biaya saat tidak ada pengguna aktif (idle).
