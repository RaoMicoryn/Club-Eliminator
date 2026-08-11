import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireAdmin } from '@/lib/requireAdmin'

export async function GET() {
  const guard = requireAdmin()
  if (guard) return guard

  const res = await query('select id, name, capacity, sort_order from clubs order by sort_order asc, name asc')
  return NextResponse.json({ clubs: res.rows })
}

export async function POST(req) {
  const guard = requireAdmin()
  if (guard) return guard

  const body = await req.json().catch(() => ({}))
  const name = (body.name ?? '').trim()
  const capacity = Number.isFinite(Number(body.capacity)) ? Math.max(0, Math.trunc(Number(body.capacity))) : 28

  if (!name) {
    return NextResponse.json({ error: 'Nama klub wajib diisi.' }, { status: 400 })
  }

  try {
    const maxOrderRes = await query('select coalesce(max(sort_order), 0) as m from clubs')
    const nextOrder = Number(maxOrderRes.rows[0].m) + 1
    const res = await query(
      'insert into clubs (name, capacity, sort_order) values ($1, $2, $3) returning id, name, capacity, sort_order',
      [name, capacity, nextOrder]
    )
    return NextResponse.json({ club: res.rows[0] }, { status: 201 })
  } catch (err) {
    if (err.code === '23505') {
      return NextResponse.json({ error: 'Nama klub itu sudah ada.' }, { status: 409 })
    }
    console.error(err)
    return NextResponse.json({ error: 'Gagal menambah klub.' }, { status: 500 })
  }
}
