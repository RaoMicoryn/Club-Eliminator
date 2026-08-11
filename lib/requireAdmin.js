import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { SESSION_COOKIE, verifySessionToken } from '@/lib/session'

// Panggil di awal tiap handler API admin. Return NextResponse (401) kalau
// belum login, atau null kalau boleh lanjut.
export function requireAdmin() {
  const token = cookies().get(SESSION_COOKIE)?.value
  if (!verifySessionToken(token)) {
    return NextResponse.json({ error: 'Belum login.' }, { status: 401 })
  }
  return null
}
