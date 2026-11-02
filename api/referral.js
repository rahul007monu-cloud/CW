import { body, clientIp, limited, normCode, normPhone, noDb, send } from './_lib/http.js'
import { cmd, hasDb } from './_lib/redis.js'
import { ensureCode } from './_lib/referral.js'
import { referralSettings } from './_lib/settings.js'

// GET  /api/referral?code=CWXXXXXX → { valid, friendPercent }
// POST /api/referral { phone }     → { code, friendPercent, referrerPercent }
export default async function handler(req, res) {
  try {
    const ref = await referralSettings()
    if (req.method === 'GET') {
      const code = normCode(req.query?.code)
      if (!ref.enabled) return send(res, 200, { valid: false, enabled: false })
      if (!code) return send(res, 400, { error: 'Missing code' })
      if (!hasDb()) return send(res, 200, { valid: null, friendPercent: ref.friendPercent })
      if (await limited('refcheck', clientIp(req), 60, 3600)) return send(res, 429, { error: 'Too many requests' })
      const owner = await cmd('GET', `ref:code:${code}`)
      return send(res, 200, { valid: Boolean(owner), friendPercent: ref.friendPercent })
    }
    if (req.method === 'POST') {
      if (!ref.enabled) return send(res, 403, { error: 'Referral programme is off right now.' })
      if (!hasDb()) return noDb(res)
      if (await limited('refnew', clientIp(req), 20, 3600)) return send(res, 429, { error: 'Too many requests. Try later.' })
      const phone = normPhone(body(req).phone)
      if (!phone) return send(res, 400, { error: 'Enter a valid 10-digit mobile number.' })
      const code = await ensureCode(phone)
      return send(res, 200, { code, friendPercent: ref.friendPercent, referrerPercent: ref.referrerPercent })
    }
    res.setHeader('Allow', 'GET, POST')
    return send(res, 405, { error: 'Method not allowed' })
  } catch (e) {
    console.error(e)
    return send(res, 500, { error: 'Server error' })
  }
}
