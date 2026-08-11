import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireAdmin } from '@/lib/requireAdmin'
import { parseTimestamp } from '@/lib/assign'

const EDITABLE = ['nama', 'kelas', 'pilihan1', 'pilihan2', 'pilihan3', 'timestampRaw']
const COLUMN = { nama: 'nama', kelas: 'kelas', pilihan1: 'pilihan1', pilihan2: 'pilihan2', pilihan3: 'pilihan3', timestampRaw: 'timestamp_raw' }

export async function PATCH(req, { params }) {
  const guard = requireAdmin()
  if (guard) return guard

  const id = Number(params.id)
  const body = await req.json().catch(() => ({}))

  const fields = []
  const values = []
  let i = 1

  for (const key of EDITABLE) {
    if (typeof body[key] === 'string') {
      fields.push(`${COLUMN[key]} = $${i++}`)
      values.push(body[key].trim())
      if (key === 'timestampRaw') {
        fields.push(`timestamp_ms = $${i++}`)
        values.push(parseTimestamp(body[key].trim()))
      }
    }
  }

  if (fields.length === 0) {
    return NextResponse.json({ error: 'Tidak ada perubahan.' }, { status: 400 })
  }

  values.push(id)

  const res = await query(
    `update students set ${fields.join(', ')} where id = $${i}
     returning id, timestamp_raw, timestamp_ms, nama, kelas, pilihan1, pilihan2, pilihan3`,
    values
  )

  if (res.rows.length === 0) {
    return NextResponse.json({ error: 'Peserta tidak ditemukan.' }, { status: 404 })
  }

  return NextResponse.json({ student: res.rows[0] })
}

export async function DELETE(_req, { params }) {
  const guard = requireAdmin()
  if (guard) return guard

  const id = Number(params.id)
  await query('delete from students where id = $1', [id])
  return NextResponse.json({ ok: true })
}
