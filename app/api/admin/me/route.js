import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { SESSION_COOKIE, verifySessionToken } from '@/lib/session'

export async function GET() {
  const token = cookies().get(SESSION_COOKIE)?.value
  const authed = verifySessionToken(token)
  return NextResponse.json({ authed })
}
