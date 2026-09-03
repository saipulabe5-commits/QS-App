# Dokumen Keamanan RAB PRO (Zero Trust & Zero Cost)

Sistem RAB PRO dirancang dengan prinsip **Local-First**, **Zero-Trust**, dan **Zero-Cost**. Berikut adalah lapisan keamanan komprehensif yang aktif di aplikasi:

## 1. Manajemen Kredensial & Autentikasi (Zero-Trust)
- **Tanpa Hardcode (Fail-Fast)**: Server mewajibkan environment variables (`JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_INITIAL_PASSWORD`). Jika hilang atau tidak valid, server akan langsung berhenti (crash) saat proses boot, mencegah kebocoran _fallback credential_.
- **Persistensi Otentikasi Lintas-Sesi**: Hashing password diatur menggunakan iterasi yang kuat dan dimuat secara aman dari `.data/users_store.json`. Skenario penggantian password (change password) akan memperbarui berkas ini sehingga di-recover secara otomatis apabila container Cloud Run me-restart (Telah teruji lulus *End-to-End Persistence Test*).
- **Offline Session TTL (72 Jam)**: Klien menyimpan JWT (token) di LocalStorage untuk mendukung fitur _offline-first_. Namun, sistem memberlakukan batas waktu (TTL) validasi terakhir dengan server. Jika pengguna offline lebih dari 72 jam, sesi ditolak (`safeLocalStorageRemove`) untuk menghindari pencurian perangkat dengan token lama yang kadaluwarsa.

## 2. Redaksi Eksport Source Code
Saat sistem mengekspor _source code_ secara lengkap melalui `/api/export/source-code`, sistem memindai string kode sumber menggunakan RegExp untuk mensensor apa pun yang memiliki format variabel kunci (misalnya `process.env.JWT_SECRET`) menggantinya dengan `***REDACTED***`.

## 3. Global AI Rate Limiter (Zero-Cost Guard)
Sistem memiliki pengaman finansial terhadap penagihan Google Cloud (Gemini API):
- Semua *endpoint* berbasis AI (termasuk 2 Agent baru) melewati `aiZeroCostGuard`.
- Maksimal **1000 permintaan per hari** (di bawah batas *free tier* Gemini 1500).
- Kuota direkam pada penyimpanan lokal persisten di `.data/ai_usage.json`.
- Apabila kuota mencapai batasnya, server otomatis menolak permintaan dengan kode HTTP 429 ("Batas pemakaian AI gratis harian telah tercapai"), yang ditangkap UI tanpa *crash*.

## 4. Financial Audit Agent (Zero-Mistake Engine)
Lapisan *Automated Quality Control* yang berjalan di atas kalkulasi RAB:
- **Pengecekan Matematis Ketat**: Secara deterministik mengidentifikasi item dengan "Harga = 0", "Volume = 0", "Duplikat", dan mendeteksi regresi *Inkonsistensi Overhead & Profit*. 
- Algoritma menolak (memberi tanda bahaya fatal) terhadap penyusupan item/kalkulasi yang rusak sehingga memastikan pelaporan keuangan (Grand Total) tidak *double-counted* atau meleset dari komponen turunannya.

## 5. Chunk-Load Retry Breaker
Mencegah *infinite loop* saat *Service Worker* atau *Vite Cache* memicu `ChunkLoadError` pasca-_deployment_:
- Retry dibatasi, dikendalikan oleh marker sementara di `sessionStorage` (`rabpro_chunk_reload_attempt`).
- Dibatasi secara definitif (1x *hard reload*). Bila masih gagal, kesalahan direlakan ke *Error Boundary UI* (tidak mencoba me-reload layar berkali-kali).
