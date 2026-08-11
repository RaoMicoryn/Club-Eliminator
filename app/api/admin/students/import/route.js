import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireAdmin } from '@/lib/requireAdmin'
import { parsePastedRows } from '@/lib/assign'

// body: { text: string, mode: 'append' | 'replace' }
export async function POST(req) {
  const guard = requireAdmin()
  if (guard) return guard

  const body = await req.json().catch(() => ({}))
  const rows = parsePastedRows(body.text ?? '')

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Tidak ada baris valid yang bisa diimpor. Pastikan format: Timestamp, Nama, Kelas, Pilihan 1, Pilihan 2, Pilihan 3.' }, { status: 400 })
  }

  const client = await (await import('@/lib/db')).getPool().connect()
  try {
    await client.query('begin')
    if (body.mode === 'replace') {
      await client.query('delete from students')
    }
    for (const r of rows) {
      await client.query(
        `insert into students (timestamp_raw, timestamp_ms, nama, kelas, pilihan1, pilihan2, pilihan3)
         values ($1, $2, $3, $4, $5, $6, $7)`,
        [r.timestampRaw, r.timestampMs, r.nama, r.kelas, r.pilihan1, r.pilihan2, r.pilihan3]
      )
    }
    await client.query('commit')
  } catch (err) {
    await client.query('rollback')
    console.error(err)
    return NextResponse.json({ error: 'Gagal mengimpor data.' }, { status: 500 })
  } finally {
    client.release()
  }

  return NextResponse.json({ ok: true, imported: rows.length })
}
