import { createHash, createHmac, timingSafeEqual } from 'node:crypto'
import { cmd, hasDb, pipeline } from './redis.js'

export function send(res, status, data) {
  res.setHeader('Cache-Control', 'no-store')
  res.status(status).json(data)
}

export function clientIp(req) {
  const fwd = req.headers['x-forwarded-for']
  return (Array.isArray(fwd) ? fwd[0] : fwd || '').split(',')[0].trim() || 'unknown'
}

export function body(req) {
  const b = req.body
  if (b && typeof b === 'object') return b
  if (typeof b === 'string') {
    try {
      return JSON.parse(b)
    } catch {
      return {}
    }
  }
  return {}
}

/**
 * Fixed-window rate limit. Returns true when the caller is over the limit.
 * Fails open if the database is not connected.
 */
export async function limited(bucket, key, max, windowSec) {
  if (!hasDb()) return false
  const k = `rl:${bucket}:${key}`
  const [count] = await pipeline([
    ['INCR', k],
    ['EXPIRE', k, windowSec, 'NX'],
  ])
  return Number(count) > max
}

const sha = (s) => createHash('sha256').update(String(s)).digest()

/**
 * Checks the `x-admin-pin` header against the ADMIN_PIN env var.
 * Sends the error response itself and returns false when not allowed.
 */
export async function requireAdmin(req, res) {
  const pin = process.env.ADMIN_PIN
  if (!pin) {
    send(res, 503, { error: 'ADMIN_PIN is not set in Vercel environment variables.' })
    return false
  }
  const ip = clientIp(req)
  if (hasDb()) {
    const fails = Number((await cmd('GET', `rl:adminfail:${ip}`)) || 0)
    if (fails >= 10) {
      send(res, 429, { error: 'Too many wrong PIN attempts. Try again in 15 minutes.' })
      return false
    }
  }
  const given = String(req.headers['x-admin-pin'] || '')
  if (!timingSafeEqual(sha(given), sha(pin))) {
    if (hasDb()) await pipeline([['INCR', `rl:adminfail:${ip}`], ['EXPIRE', `rl:adminfail:${ip}`, 900]])
    send(res, 401, { error: 'Wrong PIN.' })
    return false
  }
  return true
}

/** Normalises an Indian mobile number to 10 digits, or returns null. */
export function normPhone(v) {
  const d = String(v || '').replace(/\D/g, '').replace(/^(91|0)(?=\d{10}$)/, '')
  return /^[6-9]\d{9}$/.test(d) ? d : null
}

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

/** Stable, non-guessable referral code for a phone number, e.g. "CW7KQ2MX". */
export function referralCode(phone) {
  const secret = process.env.REFERRAL_SECRET || process.env.ADMIN_PIN || process.env.KV_REST_API_TOKEN || 'cw'
  const h = createHmac('sha256', secret).update(phone).digest()
  let out = ''
  for (let i = 0; i < 6; i++) out += ALPHABET[h[i] % ALPHABET.length]
  return 'CW' + out
}

export const normCode = (v) =>
  String(v || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 12)

export const str = (v, max = 200) => String(v ?? '').trim().slice(0, max)

export function noDb(res) {
  send(res, 503, {
    error: 'Database not connected. In Vercel: Storage → Connect Database → Upstash for Redis, then redeploy.',
    db: false,
  })
}
