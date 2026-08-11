import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireAdmin } from '@/lib/requireAdmin'
import { parseTimestamp } from '@/lib/assign'

export async function GET() {
  const guard = requireAdmin()
  if (guard) return guard

  const res = await query(
    `select id, timestamp_raw, timestamp_ms, nama, kelas, pilihan1, pilihan2, pilihan3
     from students order by timestamp_ms asc nulls last, id asc`
  )
  return NextResponse.json({ students: res.rows })
}

export async function POST(req) {
  const guard = requireAdmin()
  if (guard) return guard

  const body = await req.json().catch(() => ({}))
  const nama = (body.nama ?? '').trim()
  const pilihan1 = (body.pilihan1 ?? '').trim()

  if (!nama || !pilihan1) {
    return NextResponse.json({ error: 'Nama dan Pilihan 1 wajib diisi.' }, { status: 400 })
  }

  const timestampRaw = (body.timestampRaw ?? '').trim() || new Date().toISOString()
  const timestampMs = parseTimestamp(timestampRaw)

  const res = await query(
    `insert into students (timestamp_raw, timestamp_ms, nama, kelas, pilihan1, pilihan2, pilihan3)
     values ($1, $2, $3, $4, $5, $6, $7)
     returning id, timestamp_raw, timestamp_ms, nama, kelas, pilihan1, pilihan2, pilihan3`,
    [timestampRaw, timestampMs, nama, (body.kelas ?? '').trim(), pilihan1, (body.pilihan2 ?? '').trim(), (body.pilihan3 ?? '').trim()]
  )

  return NextResponse.json({ student: res.rows[0] }, { status: 201 })
}

// Hapus SEMUA peserta — dipakai untuk "reset" sebelum dipakai ulang tahun
// berikutnya. Klub tidak ikut terhapus.
export async function DELETE() {
  const guard = requireAdmin()
  if (guard) return guard

  await query('delete from students')
  return NextResponse.json({ ok: true })
}
