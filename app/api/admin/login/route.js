import { NextResponse } from 'next/server'
import { checkPassword, createSessionToken, SESSION_COOKIE, COOKIE_OPTIONS } from '@/lib/session'

export async function POST(req) {
  const body = await req.json().catch(() => ({}))
  const { password } = body

  if (!checkPassword(password)) {
    return NextResponse.json({ error: 'Password salah.' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set(SESSION_COOKIE, createSessionToken(), COOKIE_OPTIONS)
  return res
}
