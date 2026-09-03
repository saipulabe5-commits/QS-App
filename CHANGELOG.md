
### V14 Patch (Dynamic Import Fix & Zero-Cost Guard)
- **Fix "Failed to fetch dynamically imported module"**:
  - Dihapus berkas Service Worker ganda (`public/service-worker.js` & `sw.js`) yang menyebabkan konflik sinkronisasi _cache_ dan mencegah modul statis (seperti `RABView.tsx` dan `AHSPView.tsx`) untuk dimuat paska-pembaruan.
  - Memperbarui mekanisme `lazyWithRetry` (`src/utils/lazyImport.ts`) untuk mendeteksi `ChunkLoadError`. Jika 1x percobaan ulang (retry) tetap gagal karena chunk hilang di server (deploy baru), aplikasi secara paksa menghapus _cache_ Service Worker di _browser_ pengguna dan memaksa _hard reload_ (`window.location.reload(true)`).
  - Melakukan kompilasi bersih (menghapus folder `dist/` dan cache Vite `node_modules/.vite/`), sehingga tidak ada lagi _chunk_ yatim-piatu atau cacat saat build produksi disajikan melalui port ExpressJS `3000`.
- **Implementasi Fitur Zero-Cost AI**:
  - Memasang **Global AI Rate Limiter** (`aiZeroCostGuard`) di `server.ts` untuk melimitasi pemanggilan Gemini API (maksimal 1.000 kali per hari, direkam secara persisten ke `.data/ai_usage.json`). Jika batas tercapai, server mengembalikan error 429 yang ditangani anggun oleh antarmuka, menghindari _over-billing_.
- **Verifikasi Audit Sebelumnya**:
  1. Variabel lingkungan JWT telah disatukan secara konsisten menggunakan nama kunci rahasia `JWT_SECRET` (diverifikasi jalan di modul login).
  2. Implementasi keamanan sinkronisasi (*offline session TTL* berdurasi 72 jam) terverifikasi utuh beroperasi melalui `AppContext.tsx`.
  3. Konfigurasi `safeRound()` sudah mengkalkulasi aman `Number.EPSILON` di seluruh variabel krusial `AHSPModal.tsx`.
  4. Atribut status antrean sinkronisasi tervalidasi menggunakan skema `'cancelled'`.
  5. Seluruh memori data (Auth & Password Reset) dibuktikan terkunci di `.data/users_store.json` dan `.data/security_store.json`.
  6. Endpoint `/api/export/source-code` secara fungsional melakukan redaksi penuh (*redaction*) pada konstanta JWT dan Password API.
