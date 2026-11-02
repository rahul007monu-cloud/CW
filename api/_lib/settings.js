import { getJSON, hasDb } from './redis.js'

const ID = /^[a-z0-9-]{1,30}$/
const CARS = ['hatchback', 'sedan', 'suv']
const BILLING = ['monthly', 'yearly']

/** Default referral setup until the owner changes it in the admin. */
export const DEFAULT_REFERRAL = { enabled: true, friendPercent: 10, referrerPercent: 10 }

function money(v) {
  if (v === null || v === '' || v === undefined) return null
  const n = Math.round(Number(v))
  if (!Number.isFinite(n) || n < 0 || n > 1_000_000) throw new Error('Prices must be between 0 and 10,00,000.')
  return n
}

function percent(v, label) {
  const n = Math.round(Number(v))
  if (!Number.isFinite(n) || n < 0 || n > 100) throw new Error(`${label} must be between 0 and 100.`)
  return n
}

/** Validates and cleans settings sent from the admin. Throws with a readable message. */
export function cleanSettings(input) {
  const s = input && typeof input === 'object' ? input : {}
  const out = {}

  const wa = String(s.whatsapp ?? '').replace(/\D/g, '')
  if (wa && (wa.length < 10 || wa.length > 15)) throw new Error('WhatsApp number must have 10–15 digits incl. country code.')
  out.whatsapp = wa.length === 10 ? '91' + wa : wa

  const r = s.referral || {}
  out.referral = {
    enabled: Boolean(r.enabled),
    friendPercent: percent(r.friendPercent ?? 0, 'Friend discount'),
    referrerPercent: percent(r.referrerPercent ?? 0, 'Referrer reward'),
  }

  out.prices = {}
  for (const [planId, table] of Object.entries(s.prices || {})) {
    if (!ID.test(planId)) continue
    out.prices[planId] = {}
    for (const car of CARS) {
      out.prices[planId][car] = {}
      for (const b of BILLING) out.prices[planId][car][b] = money(table?.[car]?.[b])
    }
  }

  out.washes = {}
  for (const [planId, v] of Object.entries(s.washes || {})) {
    if (ID.test(planId)) out.washes[planId] = String(v ?? '').trim().slice(0, 40)
  }

  out.addons = {}
  for (const [id, v] of Object.entries(s.addons || {})) {
    if (ID.test(id)) out.addons[id] = money(v)
  }

  out.updatedAt = Date.now()
  return out
}

export async function loadSettings() {
  if (!hasDb()) return null
  return getJSON('settings')
}

export async function referralSettings() {
  const s = await loadSettings()
  return s?.referral ?? DEFAULT_REFERRAL
}
