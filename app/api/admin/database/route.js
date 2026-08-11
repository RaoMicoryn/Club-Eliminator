import { NextResponse } from 'next/server'
import { query, getPool } from '@/lib/db'
// (getPool dipakai buat ambil koneksi mentah karena VACUUM gak boleh lewat transaksi)
import { requireAdmin } from '@/lib/requireAdmin'

// Info ukuran database — biar keliatan berapa storage yang kepakai di Neon.
export async function GET() {
  const guard = requireAdmin()
  if (guard) return guard

  const sizeRes = await query(
    `select
       (select count(*) from students) as students_count,
       (select count(*) from clubs) as clubs_count,
       pg_size_pretty(pg_total_relation_size('students')) as students_size,
       pg_size_pretty(pg_total_relation_size('clubs')) as clubs_size,
       pg_size_pretty(pg_database_size(current_database())) as database_size`
  )

  return NextResponse.json({ info: sizeRes.rows[0] })
}

// body: { action: 'wipe_students' | 'vacuum' }
// - wipe_students: hapus SEMUA baris di tabel students lalu langsung VACUUM
//   tabel itu, jadi storage-nya beneran dibebaskan (bukan cuma ditandai
//   "hapus" doang — di Postgres/Neon baris yang di-DELETE tetap makan
//   storage sampai di-VACUUM).
// - vacuum: jalanin VACUUM aja tanpa hapus apa-apa, buat beresin sisa-sisa
//   dari delete satuan sebelumnya.
export async function POST(req) {
  const guard = requireAdmin()
  if (guard) return guard

  const body = await req.json().catch(() => ({}))
  const action = body.action

  if (action !== 'wipe_students' && action !== 'vacuum') {
    return NextResponse.json({ error: 'Aksi tidak dikenal.' }, { status: 400 })
  }

  // VACUUM tidak boleh dijalankan di dalam transaksi, jadi pinjam koneksi
  // langsung dari pool (bukan lewat query() biasa yang bisa aja kena
  // wrapper transaksi di tempat lain).
  const client = await getPool().connect()
  try {
    let deleted = 0
    if (action === 'wipe_students') {
      const del = await client.query('delete from students')
      deleted = del.rowCount ?? 0
    }
    await client.query('vacuum (full, analyze) students')
    if (action === 'wipe_students') {
      // beresin juga bloat di index-nya
      await client.query('vacuum (full, analyze) clubs')
    }
    return NextResponse.json({ ok: true, deleted })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Gagal membersihkan database.' }, { status: 500 })
  } finally {
    client.release()
  }
}
