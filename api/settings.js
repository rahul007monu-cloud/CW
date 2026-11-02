import { body, noDb, requireAdmin, send } from './_lib/http.js'
import { hasDb, setJSON } from './_lib/redis.js'
import { cleanSettings, DEFAULT_REFERRAL, loadSettings } from './_lib/settings.js'

// GET  /api/settings  → public settings (prices, WhatsApp, referral %)
// PUT  /api/settings  → admin only, saves settings
export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const settings = await loadSettings()
      return send(res, 200, {
        db: hasDb(),
        settings: settings ?? { referral: DEFAULT_REFERRAL },
      })
    }
    if (req.method === 'PUT') {
      if (!(await requireAdmin(req, res))) return
      if (!hasDb()) return noDb(res)
      let clean
      try {
        clean = cleanSettings(body(req))
      } catch (e) {
        return send(res, 400, { error: e.message })
      }
      await setJSON('settings', clean)
      return send(res, 200, { ok: true, settings: clean })
    }
    res.setHeader('Allow', 'GET, PUT')
    return send(res, 405, { error: 'Method not allowed' })
  } catch (e) {
    console.error(e)
    return send(res, 500, { error: 'Server error' })
  }
}
