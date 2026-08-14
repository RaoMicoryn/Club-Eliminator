import './globals.css'

export const metadata = {
  title: 'Seleksi Klub',
  description: 'Hasil seleksi klub berdasarkan urutan pendaftaran dan kuota per klub.',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#050816',
}

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      {/* bg gelap di sini penting buat iOS Safari: kalau nggak match, area
          overscroll-bounce di atas/bawah halaman kelihatan putih sekilas saat di-scroll. */}
      <body className="bg-[#050816] text-slate-200 antialiased">{children}</body>
    </html>
  )
}