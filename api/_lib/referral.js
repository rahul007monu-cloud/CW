import { referralCode } from './http.js'
import { pipeline } from './redis.js'

/** Creates (or returns the existing) referral code for a phone number. */
export async function ensureCode(phone) {
  const code = referralCode(phone)
  await pipeline([
    ['SET', `ref:code:${code}`, phone, 'NX'],
    ['SET', `ref:phone:${phone}`, code, 'NX'],
    ['ZADD', 'referrers', 'NX', Date.now(), code],
  ])
  return code
}
