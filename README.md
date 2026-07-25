# Seleksi Klub

Aplikasi buat nentuin siapa yang keterima/tereliminasi dari **Pilihan 1** klub berdasarkan urutan timestamp, dengan kuota per klub (default 28).

## Cara pakai

```bash
npm install
npm run dev
```

1. Copy data dari Google Sheets (kolom: Timestamp, Nama, Kelas, Pilihan 1, Pilihan 2, Pilihan 3), paste ke textarea. Atau klik **"Muat data contoh"** buat coba pakai data dummy.
2. Atur **kuota per klub**.
3. Klik **Proses**.

## Cara kerja

Data diurutkan berdasarkan timestamp (paling awal duluan). Tiap siswa dicoba masuk ke Pilihan 1 dulu — kalau klubnya udah penuh, otomatis dicoba ke Pilihan 2, lalu Pilihan 3. Kalau semua penuh → "Tidak dapat klub".

## Fitur

- **Tabel detail** — semua siswa + status (diterima / tergeser / tidak dapat klub), bisa difilter.
- **Daftar per klub** — roster tiap klub dalam bentuk tab, gampang dicek satu-satu.
- **Unduh CSV** — hasil akhir bisa didownload.

## Stack

React + Vite + Tailwind CSS v4.