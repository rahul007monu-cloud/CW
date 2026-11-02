import { randomUUID } from 'node:crypto'
import { body, clientIp, limited, normCode, normPhone, noDb, requireAdmin, send, str } from './_lib/http.js'
import { cmd, getJSON, hasDb, pipeline, setJSON } from './_lib/redis.js'
import { referralSettings } from './_lib/settings.js'
import { ensureCode } from './_lib/referral.js'

const STATUSES = ['new', 'confirmed', 'active', 'paused', 'cancelled']
const CARS = ['hatchback', 'sedan', 'suv']

function cleanBooking(b) {
  const phone = normPhone(b.phone)
  if (!phone) throw new Error('Enter a valid 10-digit mobile number.')
  const name = str(b.name, 80)
  if (name.length < 2) throw new Error('Enter your name.')
  if (!/^\d{6}$/.test(String(b.pincode || ''))) throw new Error('Enter a 6-digit pincode.')
  const mapLink = str(b.mapLink, 120)
  return {
    name,
    phone,
    carType: CARS.includes(b.carType) ? b.carType : 'sedan',
    model: str(b.model, 80),
    cars: Math.min(Math.max(parseInt(b.cars, 10) || 1, 1), 20),
    planId: str(b.planId, 30),
    planName: str(b.planName, 60),
    billing: b.billing === 'yearly' ? 'yearly' : 'monthly',
    price: Number.isFinite(Number(b.price)) && b.price !== null ? Math.round(Number(b.price)) : null,
    addons: Array.isArray(b.addons) ? b.addons.slice(0, 10).map((a) => str(a, 40)) : [],
    pincode: String(b.pincode),
    address: str(b.address, 300),
    mapLink: /^https:\/\/maps\.google\.com\/\?q=-?\d+(\.\d+)?,-?\d+(\.\d+)?$/.test(mapLink) ? mapLink : '',
    start: /^\d{4}-\d{2}-\d{2}$/.test(String(b.start || '')) ? b.start : '',
    days: Array.isArray(b.days) ? b.days.slice(0, 7).map((d) => str(d, 3)) : [],
    slot: str(b.slot, 40),
    notes: str(b.notes, 500),
    refCode: normCode(b.refCode),
  }
}

// POST   /api/bookings          → public: save a booking, returns the customer's own referral code
// GET    /api/bookings          → admin: list bookings
// PATCH  /api/bookings          → admin: { id, status?, rewardGiven?, adminNote? }
// DELETE /api/bookings?id=...   → admin
export default async function handler(req, res) {
  try {
    if (req.method === 'POST') {
      if (!hasDb()) return send(res, 200, { ok: false, db: false })
      if (await limited('book', clientIp(req), 15, 3600)) return send(res, 429, { error: 'Too many bookings from this network. Try later.' })
      let b
      try {
        b = cleanBooking(body(req))
      } catch (e) {
        return send(res, 400, { error: e.message })
      }
      const ref = await referralSettings()
      let referrerPhone = null
      if (b.refCode && ref.enabled) {
        referrerPhone = await cmd('GET', `ref:code:${b.refCode}`)
        if (referrerPhone === b.phone) referrerPhone = null // no self-referral
      }
      if (!referrerPhone) b.refCode = ''
      const booking = {
        ...b,
        id: randomUUID().slice(0, 8),
        createdAt: Date.now(),
        status: 'new',
        referrerPhone,
        friendPercent: referrerPhone ? ref.friendPercent : 0,
        referrerPercent: referrerPhone ? ref.referrerPercent : 0,
        rewardGiven: false,
        adminNote: '',
      }
      const myCode = ref.enabled ? await ensureCode(b.phone) : null
      const ops = [
        ['SET', `booking:${booking.id}`, JSON.stringify(booking)],
        ['ZADD', 'bookings', booking.createdAt, booking.id],
      ]
      if (referrerPhone) ops.push(['ZADD', `ref:uses:${b.refCode}`, booking.createdAt, booking.id])
      await pipeline(ops)
      return send(res, 200, { ok: true, id: booking.id, myCode, referralApplied: Boolean(referrerPhone) })
    }

    if (!(await requireAdmin(req, res))) return
    if (!hasDb()) return noDb(res)

    if (req.method === 'GET') {
      const ids = await cmd('ZREVRANGE', 'bookings', 0, 999)
      if (!ids.length) return send(res, 200, { bookings: [], referrers: [] })
      const raw = await cmd('MGET', ...ids.map((id) => `booking:${id}`))
      const bookings = raw.filter(Boolean).map((r) => JSON.parse(r))

      const codes = await cmd('ZREVRANGE', 'referrers', 0, 499)
      let referrers = []
      if (codes.length) {
        const ops = codes.flatMap((c) => [['GET', `ref:code:${c}`], ['ZCARD', `ref:uses:${c}`]])
        const out = await pipeline(ops)
        referrers = codes
          .map((code, i) => ({ code, phone: out[i * 2], uses: Number(out[i * 2 + 1]) }))
          .filter((r) => r.uses > 0)
          .sort((a, b) => b.uses - a.uses)
      }
      return send(res, 200, { bookings, referrers })
    }

    if (req.method === 'PATCH') {
      const p = body(req)
      const id = str(p.id, 20)
      const current = await getJSON(`booking:${id}`)
      if (!current) return send(res, 404, { error: 'Booking not found' })
      if (p.status !== undefined) {
        if (!STATUSES.includes(p.status)) return send(res, 400, { error: 'Bad status' })
        current.status = p.status
      }
      if (p.rewardGiven !== undefined) current.rewardGiven = Boolean(p.rewardGiven)
      if (p.adminNote !== undefined) current.adminNote = str(p.adminNote, 500)
      current.updatedAt = Date.now()
      await setJSON(`booking:${id}`, current)
      return send(res, 200, { ok: true, booking: current })
    }

    if (req.method === 'DELETE') {
      const id = str(req.query?.id, 20)
      const current = await getJSON(`booking:${id}`)
      const ops = [['DEL', `booking:${id}`], ['ZREM', 'bookings', id]]
      if (current?.refCode) ops.push(['ZREM', `ref:uses:${current.refCode}`, id])
      await pipeline(ops)
      return send(res, 200, { ok: true })
    }

    res.setHeader('Allow', 'GET, POST, PATCH, DELETE')
    return send(res, 405, { error: 'Method not allowed' })
  } catch (e) {
    console.error(e)
    return send(res, 500, { error: 'Server error' })
  }
}
