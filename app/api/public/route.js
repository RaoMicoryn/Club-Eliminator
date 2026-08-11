import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { rowsToStudents, assignClubs } from '@/lib/assign'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const clubsRes = await query('select id, name, capacity from clubs order by sort_order asc, name asc')
    const studentsRes = await query(
      'select id, timestamp_raw, timestamp_ms, nama, kelas, pilihan1, pilihan2, pilihan3 from students'
    )

    const clubs = clubsRes.rows
    const capacities = Object.fromEntries(clubs.map((c) => [c.name, c.capacity]))

    const students = rowsToStudents(studentsRes.rows)
    const processed = students.length > 0 ? assignClubs(students, capacities) : { results: [], counts: {} }

    return NextResponse.json({
      clubs: clubs.map((c) => ({ name: c.name, capacity: c.capacity })),
      results: processed.results,
      counts: processed.counts,
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Gagal mengambil data. Cek konfigurasi database.' }, { status: 500 })
  }
}
