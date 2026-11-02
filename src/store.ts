import { useSyncExternalStore } from 'react'
import { PLANS, type Billing, type CarType } from './config'

export const PAINTS = [
  { name: 'Racing Red', hex: '#b3141c' },
  { name: 'Pearl White', hex: '#e8ecf1' },
  { name: 'Midnight Black', hex: '#0c0e13' },
  { name: 'Electric Blue', hex: '#1d4ed8' },
  { name: 'Titan Silver', hex: '#9aa3ad' },
  { name: 'Graphite Grey', hex: '#3a3f47' },
]

export type Referral = { enabled: boolean; friendPercent: number; referrerPercent: number }

/** Settings the owner edits in /admin. Anything missing falls back to src/config.ts. */
export type RemoteSettings = {
  whatsapp?: string
  referral?: Referral
  prices?: Record<string, Record<CarType, Record<Billing, number | null>>>
  washes?: Record<string, string>
  addons?: Record<string, number | null>
}

type State = {
  carType: CarType
  paint: string
  planId: string
  billing: Billing
  settings: RemoteSettings
  db: boolean
  refCode: string
}

let state: State = {
  carType: 'sedan',
  paint: PAINTS[0].hex,
  planId: PLANS[1]?.id ?? PLANS[0].id,
  billing: 'monthly',
  settings: {},
  db: false,
  refCode: '',
}

const listeners = new Set<() => void>()

export const appStore = {
  get: () => state,
  set(patch: Partial<State>) {
    state = { ...state, ...patch }
    listeners.forEach((l) => l())
  },
  subscribe(l: () => void) {
    listeners.add(l)
    return () => {
      listeners.delete(l)
    }
  },
}

export function useApp() {
  return useSyncExternalStore(appStore.subscribe, appStore.get, appStore.get)
}

/**
 * Scroll-driven values shared with the 3D scene. Mutated every frame by
 * the scene (no React re-renders), read by every 3D effect.
 */
export const motion = {
  page: 0, // 0 → 1 over the whole page
  story: 0, // 0 → 1 over the hero + wash story
  focus: 0, // 0 → 1 while the showroom section is centred
  dirt: 1,
  foam: 0,
  water: 0,
  shine: 0,
}
