import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireAdmin } from '@/lib/requireAdmin'

export async function PATCH(req, { params }) {
  const guard = requireAdmin()
  if (guard) return guard

  const id = Number(params.id)
  const body = await req.json().catch(() => ({}))

  const fields = []
  const values = []
  let i = 1

  if (typeof body.name === 'string' && body.name.trim()) {
    fields.push(`name = $${i++}`)
    values.push(body.name.trim())
  }
  if (body.capacity !== undefined && Number.isFinite(Number(body.capacity))) {
    fields.push(`capacity = $${i++}`)
    values.push(Math.max(0, Math.trunc(Number(body.capacity))))
  }
  if (body.sort_order !== undefined && Number.isFinite(Number(body.sort_order))) {
    fields.push(`sort_order = $${i++}`)
    values.push(Math.trunc(Number(body.sort_order)))
  }

  if (fields.length === 0) {
    return NextResponse.json({ error: 'Tidak ada perubahan.' }, { status: 400 })
  }

  values.push(id)

  try {
    const res = await query(
      `update clubs set ${fields.join(', ')} where id = $${i} returning id, name, capacity, sort_order`,
      values
    )
    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Klub tidak ditemukan.' }, { status: 404 })
    }
    return NextResponse.json({ club: res.rows[0] })
  } catch (err) {
    if (err.code === '23505') {
      return NextResponse.json({ error: 'Nama klub itu sudah ada.' }, { status: 409 })
    }
    console.error(err)
    return NextResponse.json({ error: 'Gagal mengubah klub.' }, { status: 500 })
  }
}

export async function DELETE(_req, { params }) {
  const guard = requireAdmin()
  if (guard) return guard

  const id = Number(params.id)
  await query('delete from clubs where id = $1', [id])
  return NextResponse.json({ ok: true })
}
