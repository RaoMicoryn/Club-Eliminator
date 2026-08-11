// Menjalankan schema.sql ke database Neon yang ditunjuk oleh DATABASE_URL.
// Pakai: npm run db:migrate
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import pg from 'pg'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL belum di-set. Isi dulu di file .env.local (lihat .env.example).')
  process.exit(1)
}

const sql = readFileSync(path.join(__dirname, '..', 'schema.sql'), 'utf-8')

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

try {
  await client.connect()
  await client.query(sql)
  console.log('✅ Migrasi selesai. Tabel clubs, students, app_settings siap dipakai.')
} catch (err) {
  console.error('❌ Migrasi gagal:', err.message)
  process.exit(1)
} finally {
  await client.end()
}
