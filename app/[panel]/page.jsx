import { notFound } from 'next/navigation'
import AdminClient from './AdminClient'

// Path panel admin ditentukan lewat env var ADMIN_PATH (bukan hardcode
// "/admin"), jadi lebih susah ditebak dan bisa diganti kapan saja tanpa
// ubah kode — tinggal ubah environment variable lalu redeploy.
export default function PanelPage({ params }) {
  const expected = process.env.ADMIN_PATH
  if (!expected || params.panel !== expected) {
    notFound()
  }
  return <AdminClient />
}
