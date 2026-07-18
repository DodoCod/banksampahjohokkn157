# Bank Sampah Karang Taruna

Aplikasi web pencatatan pengumpulan, stok, penjualan, dan kas Bank Sampah untuk
Karang Taruna. Dibangun dengan Next.js (App Router) + TypeScript + TailwindCSS,
dengan **Google Spreadsheet sebagai database** — tanpa perlu server database
dan tanpa login.

## Fitur

- **Login sederhana** dengan satu password admin (session cookie, dilindungi `proxy.ts`).
- Pencatatan pengumpulan sampah per batch, per warga, dengan status **Hibah**,
  **Dijual**, atau **Sebagian** (dipecah otomatis jadi 2 baris).
- Snapshot harga beli saat transaksi dibuat (histori tidak berubah walau harga
  master diupdate).
- Stok dengan pelacakan asal (batch mana, hibah/beli).
- Penjualan ke pengepul dengan pengambilan stok otomatis metode **FIFO**.
- Perhitungan laba bersih (pendapatan - modal) otomatis masuk ke **Kas**.
- Dashboard ringkasan + grafik.
- Modal konfirmasi sebelum menghapus data, dan loading state di setiap
  pengambilan/pengiriman data.
- Sidebar di desktop, bottom navigation bar di mobile.

## Menjalankan secara lokal

```bash
npm install
cp .env.local.example .env.local   # lalu isi sesuai langkah di bawah
npm run dev
```

Buka http://localhost:3000. Sebelum data bisa dibaca/ditulis, kamu perlu
menghubungkan aplikasi ke Google Spreadsheet (langkah di bawah), lalu buka
halaman **/setup** sekali untuk membuat sheet dan header secara otomatis.

## Setup Login

Aplikasi dilindungi satu password admin (bukan sistem user/role, sesuai PRD
yang hanya punya 1 role). Diatur lewat dua environment variable di
`.env.local`:

```
ADMIN_PASSWORD=isi-password-bebas
SESSION_SECRET=string-acak-panjang
```

- `ADMIN_PASSWORD`: password yang dipakai semua pengurus untuk masuk lewat
  halaman `/login`.
- `SESSION_SECRET`: string acak untuk menandatangani cookie sesi. Ganti
  dengan nilai unik & panjang sebelum deploy ke production (jangan pakai
  nilai default di `.env.local.example`).

Setelah login berhasil, cookie sesi berlaku 30 hari. Tombol **Logout** ada di
sidebar (desktop) dan bisa dipanggil dari action `logoutAction`.

## Setup Google Sheets API

Aplikasi terhubung ke Google Sheets menggunakan **Service Account** (akun
robot), bukan akun Google pribadi, supaya tidak perlu login OAuth setiap
deploy.

### 1. Buat Google Cloud Project & aktifkan Google Sheets API

1. Buka console.cloud.google.com, buat project baru (atau pakai yang sudah ada).
2. Buka menu **APIs & Services -> Library**, cari **Google Sheets API**, klik
   **Enable**.

### 2. Buat Service Account

1. Buka **APIs & Services -> Credentials -> Create Credentials -> Service
   Account**.
2. Isi nama bebas, misalnya `banksampah-sheets`. Lanjut tanpa perlu memberi
   role project (klik **Done**).
3. Klik service account yang baru dibuat -> tab **Keys -> Add Key -> Create
   new key -> JSON**. File JSON akan otomatis terdownload - simpan baik-baik,
   ini dipakai sekali saja.

### 3. Isi environment variable dari file JSON

Buka file JSON yang terdownload, ambil dua nilai berikut:

- `client_email` -> isi ke `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `private_key` -> isi ke `GOOGLE_PRIVATE_KEY` (bungkus dengan tanda kutip
  ganda, biarkan `\n` apa adanya)

### 4. Buat Spreadsheet & bagikan ke Service Account

1. Buat Google Spreadsheet baru di sheets.google.com.
2. Ambil **Spreadsheet ID** dari URL:
   `https://docs.google.com/spreadsheets/d/`**`INI_SPREADSHEET_ID`**`/edit`
   -> isi ke `GOOGLE_SPREADSHEET_ID`.
3. Klik **Share** di spreadsheet tersebut, tempel email dari
   `GOOGLE_SERVICE_ACCOUNT_EMAIL` (formatnya seperti
   `xxx@xxx.iam.gserviceaccount.com`), beri akses **Editor**. Tanpa langkah
   ini, aplikasi tidak akan bisa membaca/menulis data.

### 5. Buat sheet & header otomatis

Jalankan aplikasi (`npm run dev`), buka `http://localhost:3000/setup`, lalu
klik **Buat Sheet & Header**. Aplikasi akan otomatis membuat 6 sheet berikut
jika belum ada, beserta header kolomnya:

`JenisSampah`, `Batch`, `Pengumpulan`, `Penjualan`, `DetailPenjualan`, `Kas`

Struktur kolom lengkap ada di `lib/sheets-client.ts` (`SHEET_HEADERS`).

## Deploy ke Netlify

1. Push kode ini ke GitHub/GitLab.
2. Di Netlify, **Add new site -> Import an existing project**, hubungkan repo
   ini. Build command `next build`, publish directory otomatis terdeteksi
   (Netlify punya adapter Next.js resmi).
3. Di **Site settings -> Environment variables**, tambahkan lima variable
   yang sama seperti di `.env.local` (`GOOGLE_SERVICE_ACCOUNT_EMAIL`,
   `GOOGLE_PRIVATE_KEY`, `GOOGLE_SPREADSHEET_ID`, `ADMIN_PASSWORD`,
   `SESSION_SECRET`).
4. Deploy. Setelah live, buka `/setup` sekali untuk memastikan sheet & header
   sudah dibuat (aman dijalankan berkali-kali).

## Struktur folder

```
app/
 |- dashboard        # ringkasan + grafik
 |- jenis-sampah      # master data jenis sampah & harga
 |- batch             # daftar & buat batch pengumpulan
 |   `- [id]           # detail batch: tambah setoran warga
 |- stok              # ringkasan & detail stok (FIFO)
 |- penjualan         # catat penjualan ke pengepul
 |- kas               # riwayat kas
 |- setup             # inisialisasi sheet & header
 `- actions           # Server Actions (create/update/delete)

components/
 |- ui/primitives.tsx  # Button, Card, Input, Table, dll
 `- ...                # form-form spesifik per halaman

services/
 |- sheets.ts          # CRUD bertipe ke Google Sheets
 |- stock.ts           # ringkasan stok & algoritma FIFO
 `- finance.ts         # perhitungan kas & ringkasan dashboard

lib/
 |- sheets-client.ts   # klien low-level Google Sheets API (auth, read/write)
 |- safe-load.ts       # helper untuk menangani error koneksi Sheets di halaman
 `- utils.ts           # format Rupiah, tanggal, dll

types/index.ts           # semua tipe data
```

## Catatan penting

- **Atomisitas**: Google Sheets API tidak mendukung transaksi database
  sungguhan. Proses penjualan menulis beberapa baris secara berurutan
  (Penjualan -> DetailPenjualan -> update sisa stok -> Kas). Untuk skala
  penggunaan Karang Taruna (satu admin, jarang terjadi tabrakan input
  bersamaan) ini cukup aman, tapi jika suatu saat butuh jaminan atomisitas
  penuh, langkah selanjutnya adalah migrasi ke database sungguhan (mis.
  PostgreSQL) - arsitektur `services/` sudah dipisah supaya ini bisa
  dilakukan tanpa mengubah halaman/komponen.
- **Rate limit Google Sheets API**: default 60 request/menit per user per
  project. Untuk pemakaian internal Karang Taruna ini jauh dari batas
  tersebut.
- Tidak ada fitur login - sesuai PRD, hanya ada 1 role (Admin/Karang Taruna)
  dan aplikasi ditujukan untuk dipakai di lingkungan terbatas/internal.
