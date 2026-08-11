import './globals.css'

export const metadata = {
  title: 'Seleksi Klub',
  description: 'Hasil seleksi klub berdasarkan urutan pendaftaran dan kuota per klub.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className="bg-slate-50 text-slate-900 antialiased">{children}</body>
    </html>
  )
}
