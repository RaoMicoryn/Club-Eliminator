# Seleksi Klub

Aplikasi buat nentuin siapa yang keterima/tereliminasi dari **Pilihan 1** klub berdasarkan urutan timestamp, dengan kuota per klub yang bisa diatur sendiri.

Sekarang datanya tersimpan di database (Neon Postgres) lewat panel pengelola, jadi:
- Bisa dipakai berulang kali tiap tahun/angkatan (tinggal reset data peserta, klub tetap).
- Daftar klub, kuota per klub, dan data peserta bisa diubah/dihapus dari panel pengelola — tanpa sentuh kode.
- Panel pengelola **tidak** ada di `/admin` supaya tidak gampang ditebak — path-nya kamu tentukan sendiri lewat environment variable.

## 1. Siapkan database Neon

1. Buat project baru di [neon.tech](https://neon.tech) (gratis).
2. Di dashboard Neon, buka **Connect** → salin **connection string** (yang "pooled connection").
3. Simpan itu, dipakai untuk `DATABASE_URL` di langkah berikutnya.

## 2. Setup environment variables

Copy `.env.example` jadi `.env.local`, lalu isi:

```
DATABASE_URL=       # connection string dari Neon
ADMIN_PASSWORD=      # password buat login ke panel pengelola
ADMIN_SECRET=        # string acak, minimal 20 karakter (mis. hasil `openssl rand -hex 32`)
ADMIN_PATH=           # path rahasia panel, tanpa "/", jangan pakai "admin" — mis. kelola-2026x
```

Contoh isi:

```
DATABASE_URL=postgresql://user:pass@ep-xxxx-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
ADMIN_PASSWORD=SuperRahasia123!
ADMIN_SECRET=8f2a91c4e7b6d05a3f1e9c8b7a6d5e4f3c2b1a09
ADMIN_PATH=kelola-klub-2026
```

## 3. Install & migrasi database

```bash
npm install
npm run db:migrate
```

Perintah `db:migrate` bakal bikin tabel `clubs`, `students`, `app_settings` di Neon, dan otomatis mengisi 6 klub awal (Accounting, Broadcast, English Club, Fotografi, Performing Arts, Sketsa dan Ilustrasi) dengan kuota default 28 — yang semuanya bisa langsung diubah dari panel pengelola.

## 4. Jalankan

```bash
npm run dev
```

- Halaman publik: `http://localhost:3000`
- Panel pengelola: `http://localhost:3000/<ADMIN_PATH>` (sesuai yang kamu isi di `.env.local`)

## Panel pengelola — apa saja yang bisa diatur

- **Klub & Kuota**: tambah klub baru, ubah nama klub, ubah kuota (batas "total akhir") per klub, atau hapus klub.
- **Peserta**: lihat semua peserta, edit satu-satu (nama, kelas, pilihan 1/2/3, timestamp), atau hapus.
- **Import massal**: tempel data dari Google Sheets (kolom: Timestamp, Nama, Kelas, Pilihan 1, Pilihan 2, Pilihan 3) — bisa ditambahkan ke data yang ada, atau reset total lalu ganti semua.
- Tombol **"Reset semua peserta"** di tab Peserta — buat mulai bersih tahun berikutnya tanpa perlu hapus/bikin ulang klub.

Login panel pakai satu password (`ADMIN_PASSWORD`) yang tersimpan sebagai environment variable, bukan di database atau di kode — jadi tidak ikut ter-commit ke Git.

## Cara kerja seleksi

Data peserta diurutkan berdasarkan timestamp (paling awal duluan). Tiap peserta dicoba masuk ke Pilihan 1 dulu — kalau klubnya udah penuh, otomatis dicoba ke Pilihan 2, lalu Pilihan 3. Kalau semua penuh → "Tidak dapat klub". Hasil ini dihitung ulang otomatis setiap kali halaman publik dibuka, jadi selalu sinkron dengan data terbaru di panel pengelola.

## Deploy (disarankan: Vercel)

1. Push folder ini ke GitHub.
2. Import repo-nya di [vercel.com](https://vercel.com).
3. Di **Project Settings → Environment Variables**, isi `DATABASE_URL`, `ADMIN_PASSWORD`, `ADMIN_SECRET`, `ADMIN_PATH` (sama seperti `.env.local`).
4. Deploy. Panel pengelola otomatis ada di `https://domainmu.vercel.app/<ADMIN_PATH>`.

Ganti `ADMIN_PATH` kapan saja lewat Environment Variables di Vercel (tanpa ubah kode) kalau kamu curiga path-nya bocor — redeploy, path lama otomatis jadi 404.

## Fitur

- **Cek hasil per nama** — dengan animasi confetti/hujan + efek suara, sama seperti versi awal.
- **Ringkasan per klub** — peminat, diterima, tereliminasi, total akhir vs kuota.
- **Unduh CSV** — hasil akhir bisa didownload dari halaman publik maupun panel pengelola.
- **Panel pengelola** — kelola klub, kuota, dan peserta kapan saja, data tersimpan permanen di Neon.

## Stack

Next.js (App Router) + Neon Postgres (`pg`) + Tailwind CSS.
