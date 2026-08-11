import crypto from 'node:crypto'

export const SESSION_COOKIE = 'admin_session'
const MAX_AGE_SECONDS = 60 * 60 * 12 // 12 jam

function getSecret() {
  const secret = process.env.ADMIN_SECRET
  if (!secret) {
    throw new Error('ADMIN_SECRET belum di-set di environment variables.')
  }
  return secret
}

// Token sederhana: "expiry.signature". Tidak menyimpan data sensitif apapun,
// cuma bukti "sudah login sebelum waktu expiry" — cukup untuk single-role
// admin panel tanpa perlu database sesi.
export function createSessionToken() {
  const expiry = Date.now() + MAX_AGE_SECONDS * 1000
  const sig = crypto.createHmac('sha256', getSecret()).update(String(expiry)).digest('hex')
  return `${expiry}.${sig}`
}

export function verifySessionToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return false
  const [expiryStr, sig] = token.split('.')
  const expiry = Number(expiryStr)
  if (!expiry || Number.isNaN(expiry) || expiry < Date.now()) return false
  const expectedSig = crypto.createHmac('sha256', getSecret()).update(String(expiry)).digest('hex')
  try {
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))
  } catch {
    return false
  }
}

export function checkPassword(input) {
  const expected = process.env.ADMIN_PASSWORD
  if (!expected) return false
  const a = Buffer.from(String(input ?? ''))
  const b = Buffer.from(String(expected))
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: MAX_AGE_SECONDS,
}
