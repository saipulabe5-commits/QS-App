# 📋 Panduan & Checklist Deployment (Production Environment)

Dokumen ini adalah referensi resmi seluruh **Environment Variable** yang dibutuhkan aplikasi **RAB Pro Enterprise** sebelum melakukan *deployment* ke platform hosting production (seperti **Render**, **Railway**, **VPS**, **Docker**, atau **Cloud Run**).

---

## ⚡ Ringkasan Cepat: Variabel Wajib vs Opsional

| Nama Variabel | Status di Production | Min. Panjang | Deskripsi Singkat | Contoh Nilai |
| :--- | :---: | :---: | :--- | :--- |
| **`JWT_SECRET`** | 🔴 **WAJIB** | 32 karakter | Kunci enkripsi tanda tangan JWT session & otentikasi | `e8f92a10b4c8d76e5f3a2b1c9d8e7f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e` |
| **`ADMIN_EMAIL`** | 🔴 **WAJIB** | 5 karakter | Alamat email administrator sistem pertama kali | `admin@perusahaan.com` |
| **`ADMIN_INITIAL_PASSWORD`**| 🔴 **WAJIB** | 8 karakter | Password awal administrator (ganti setelah login) | `AdminSecurePass#2026!` |
| **`OWNER_EMAIL`** | 🔴 **WAJIB** | 5 karakter | Email master pemilik akun untuk verifikasi keamanan & pemulihan | `owner@perusahaan.com` |
| **`ALLOWED_ORIGIN`** | 🔴 **WAJIB** | - | Domain URL frontend yang diizinkan untuk proteksi CORS | `https://rab-pro.onrender.com` |
| `GEMINI_API_KEY` | 🟡 *Sangat Disarankan* | - | Kunci API Google Gemini untuk fitur AI (QS Chat, Estimator, Auto-Kategori) | `AIzaSy...` |
| `OWNER_EMAIL_ALIAS` | ⚪ *Opsional* | - | Alias email sekunder yang diizinkan mengelola sistem | `direktur@perusahaan.com` |
| `SMTP_HOST` | ⚪ *Opsional* | - | Server SMTP untuk pengiriman email kode reset password | `smtp.gmail.com` |
| `SMTP_PORT` | ⚪ *Opsional* | - | Port server SMTP (465 untuk SSL, 587 untuk TLS) | `465` |
| `SMTP_USER` | ⚪ *Opsional* | - | Username / email akun pengirim SMTP | `notifikasi@perusahaan.com` |
| `SMTP_PASS` | ⚪ *Opsional* | - | Password akun SMTP atau Google App Password 16 karakter | `abcd efgh ijkl mnop` |
| `SMTP_FROM` | ⚪ *Opsional* | - | Nama & header pengirim email keluar | `"RAB Pro Security" <notifikasi@perusahaan.com>` |
| `PORT` | ⚪ *Otomatis* | - | Port server internal (otomatis diatur oleh Render/hosting) | `3000` |
| `NODE_ENV` | ⚪ *Otomatis* | - | Mode lingkungan server | `production` |

---

## 🔒 1. Penjelasan Detail Variabel Wajib (Production)

### 1. `JWT_SECRET` (Minimal 32 karakter)
- **Fungsi**: Digunakan oleh library `jsonwebtoken` untuk menandatangani access token pengguna dan memvalidasi integritas sesi.
- **Bahaya jika bocor/lemah**: Token dapat dipalsukan oleh penyerang jika secret mudah ditebak.
- **Cara membuat string acak 64 karakter**:
  Jalankan perintah ini di terminal komputer Anda:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
  Salin hasilnya (contoh: `d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5`) dan tempelkan ke dashboard Render.

---

### 2. `ADMIN_EMAIL` (Minimal 5 karakter)
- **Fungsi**: Akun pengguna administrator pertama yang otomatis dibuat ke dalam basis data saat server pertama kali dijalankan.
- **Contoh**: `admin@perusahaan.com` atau `saipulabe5@gmail.com`.

---

### 3. `ADMIN_INITIAL_PASSWORD` (Minimal 8 karakter)
- **Fungsi**: Kata sandi awal untuk akun `ADMIN_EMAIL`.
- **Rekomendasi**: Gunakan kombinasi huruf besar, huruf kecil, angka, dan simbol (minimal 8 karakter).
- **Contoh**: `AdminSuperRAB#2026`

---

### 4. `OWNER_EMAIL` (Minimal 5 karakter)
- **Fungsi**: Kebijakan keamanan akun tunggal (*Strict Single-Account Policy*) dan penanganan hak istimewa *owner*. Seluruh kode reset sandi darurat dan notifikasi keamanan tingkat tinggi dikirimkan ke email ini.
- **Penting**: Ini adalah variabel yang sering terlewat jika belum diset di dashboard hosting.
- **Contoh**: `saipulabe5@gmail.com`

---

### 5. `ALLOWED_ORIGIN` (Khusus Production)
- **Fungsi**: Menentukan URL domain frontend yang diizinkan berkomunikasi dengan API backend melalui proteksi CORS (Cross-Origin Resource Sharing).
- **Format**: Masukkan URL lengkap termasuk protokol `https://` tanpa garis miring di akhir (`/`). Jika ada lebih dari satu domain, pisahkan dengan tanda koma tanpa spasi.
- **Contoh**:
  - Satu domain: `https://rab-pro.onrender.com`
  - Dua domain (misal custom domain): `https://rab-pro.onrender.com,https://app.namadomain.com`

---

## 🤖 2. Variabel AI & Fitur Tambahan (Opsional / Rekomendasi)

### `GEMINI_API_KEY`
- **Fungsi**: Mengaktifkan seluruh kapabilitas kecerdasan buatan (AI) pada aplikasi:
  - **AI QS Interactive Chat**: Asisten Quantity Surveyor untuk konsultasi RAB & spesifikasi SNI.
  - **AI Smart Auto-Categorization**: Klasifikasi otomatis pekerjaan berdasarkan analisa deskripsi.
  - **AI Bug Diagnostics**: Diagnosis otomatis galat sistem dan rekomendasi perbaikan.
  - **AI RAB & Cost Escalation Engine**: Analisis fluktuasi harga material dan eskalasi biaya.
  - **AI Drawing OCR & Volume Extractor**: Ekstraksi volume dari gambar denah/sketsa teknik.
- **Cara Mendapatkan**: Dapatkan secara gratis atau berbayar di [Google AI Studio](https://aistudio.google.com/app/apikey).

### Konfigurasi SMTP (Email Otentikasi & Reset Sandi)
Jika Anda ingin fitur reset kata sandi mengirim email nyata ke pengguna/owner:
- `SMTP_HOST`: `smtp.gmail.com` (atau SMTP penyedia email Anda)
- `SMTP_PORT`: `465` (SSL) atau `587` (TLS)
- `SMTP_USER`: Email Anda, misal `notifikasi@gmail.com`
- `SMTP_PASS`: Jika menggunakan Gmail dengan 2FA, buat **App Password** 16 karakter di akun Google Anda ([Petunjuk Google App Passwords](https://myaccount.google.com/apppasswords)).
- `SMTP_FROM`: `"RAB Pro Support" <notifikasi@gmail.com>`

---

## 🚀 3. Panduan Pengisian di Dashboard Render (Langkah demi Langkah)

Agar tidak terjadi kegagalan deploy berulang kali, masukkan seluruh variabel yang dibutuhkan **sekaligus**:

1. Buka [Dashboard Render](https://dashboard.render.com).
2. Pilih layanan **Web Service** aplikasi Anda.
3. Klik menu **Environment** di navigasi sebelah kiri.
4. Klik tombol **Add Environment Variable** (atau **Add from .env** jika menyalin teks).
5. Masukkan minimal 5 variabel wajib berikut:
   ```text
   JWT_SECRET=paste_string_acak_minimal_32_karakter_disini
   ADMIN_EMAIL=admin@domainanda.com
   ADMIN_INITIAL_PASSWORD=PasswordKuatMinimal8Karakter!
   OWNER_EMAIL=email_pemilik_anda@gmail.com
   ALLOWED_ORIGIN=https://nama-aplikasi-anda.onrender.com
   ```
6. *(Disarankan)* Tambahkan juga `GEMINI_API_KEY`:
   ```text
   GEMINI_API_KEY=AIzaSy...kunci_gemini_anda...
   ```
7. Klik tombol **Save Changes**.
8. Klik tombol **Manual Deploy** > **Deploy latest commit**.

---

## 🛡️ 4. Sistem Validasi Terpadu (`validateAllRequiredEnv`)

Sistem di `server.ts` telah dilengkapi fungsi validasi kolektif:
- Pada saat server dijalankan (`NODE_ENV=production`), sistem akan memeriksa **seluruh variabel wajib sekaligus**.
- Jika terdapat 1 atau lebih variabel yang belum terisi atau panjangnya kurang dari batas aman, server akan mencetak **daftar lengkap seluruh variabel yang bermasalah dalam satu log error** sebelum menghentikan proses.
- Hal ini mencegah siklus deploy ulang berulang-ulang yang melelahkan.
