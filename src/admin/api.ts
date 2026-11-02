import type { RemoteSettings } from '../store'

const KEY = 'cw-admin-pin'
export const getPin = () => sessionStorage.getItem(KEY) || ''
export const setPin = (p: string) => sessionStorage.setItem(KEY, p)
export const clearPin = () => sessionStorage.removeItem(KEY)

export type Status = 'new' | 'confirmed' | 'active' | 'paused' | 'cancelled'

export type Booking = {
  id: string
  createdAt: number
  status: Status
  name: string
  phone: string
  carType: string
  model: string
  cars: number
  planId: string
  planName: string
  billing: string
  price: number | null
  addons: string[]
  pincode: string
  address: string
  mapLink: string
  start: string
  days: string[]
  slot: string
  notes: string
  refCode: string
  referrerPhone: string | null
  friendPercent: number
  referrerPercent: number
  rewardGiven: boolean
  adminNote: string
}

export type Referrer = { code: string; phone: string; uses: number }

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message)
  }
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const r = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', 'x-admin-pin': getPin(), ...(init.headers || {}) },
  })
  const isJson = r.headers.get('content-type')?.includes('json')
  const data = isJson ? await r.json() : null
  if (!r.ok) throw new ApiError(data?.error || `Request failed (${r.status})`, r.status)
  if (!isJson) throw new ApiError('API not reachable. Is this deployed on Vercel?', 0)
  return data as T
}

export const api = {
  bookings: () => call<{ bookings: Booking[]; referrers: Referrer[] }>('/api/bookings'),
  update: (id: string, patch: Partial<Pick<Booking, 'status' | 'rewardGiven' | 'adminNote'>>) =>
    call<{ booking: Booking }>('/api/bookings', { method: 'PATCH', body: JSON.stringify({ id, ...patch }) }),
  remove: (id: string) => call('/api/bookings?id=' + encodeURIComponent(id), { method: 'DELETE' }),
  settings: () => call<{ db: boolean; settings: RemoteSettings }>('/api/settings'),
  saveSettings: (s: RemoteSettings) =>
    call<{ settings: RemoteSettings }>('/api/settings', { method: 'PUT', body: JSON.stringify(s) }),
}
