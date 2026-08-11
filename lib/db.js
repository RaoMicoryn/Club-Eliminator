import pg from 'pg'

// Satu connection pool dipakai ulang selama proses server hidup (penting di
// serverless: hindari bikin pool baru tiap request).
let pool

export function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL belum di-set di environment variables.')
    }
    pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 5,
    })
  }
  return pool
}

export async function query(text, params) {
  return getPool().query(text, params)
}
