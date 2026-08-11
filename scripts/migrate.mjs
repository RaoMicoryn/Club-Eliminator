// Menjalankan schema.sql ke database Neon yang ditunjuk oleh DATABASE_URL.
// Pakai: npm run db:migrate
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import pg from 'pg'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.join(__dirname, '..')

// Script ini jalan lewat `node`, bukan lewat Next.js — jadi .env.local tidak
// otomatis kebaca seperti saat `next dev`/`next build`. Baca manual di sini.
function loadEnvLocal() {
  const envPath = path.join(projectRoot, '.env.local')
  if (!existsSync(envPath)) return
  const content = readFileSync(envPath, 'utf-8')
  content.split('\n').forEach((line) => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) return
    const eq = trimmed.indexOf('=')
    if (eq === -1) return
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    // buang tanda kutip pembungkus kalau ada
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (key && !(key in process.env)) process.env[key] = value
  })
}

loadEnvLocal()

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
