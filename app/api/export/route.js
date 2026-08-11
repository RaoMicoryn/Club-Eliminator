import { query } from '@/lib/db'
import { rowsToStudents, assignClubs, toCSV } from '@/lib/assign'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const clubsRes = await query('select name, capacity from clubs order by sort_order asc, name asc')
    const studentsRes = await query(
      'select id, timestamp_raw, timestamp_ms, nama, kelas, pilihan1, pilihan2, pilihan3 from students'
    )

    const capacities = Object.fromEntries(clubsRes.rows.map((c) => [c.name, c.capacity]))
    const students = rowsToStudents(studentsRes.rows)
    const processed = students.length > 0 ? assignClubs(students, capacities) : { results: [] }

    const csv = toCSV(processed.results)
    return new Response('\uFEFF' + csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="hasil-seleksi-klub.csv"',
      },
    })
  } catch (err) {
    console.error(err)
    return new Response('Gagal membuat CSV', { status: 500 })
  }
}
