import { useEffect, useRef } from 'react'
import { ADDONS, BRAND, PLANS, REFERRAL, type Billing, type CarType } from './config'
import { appStore, type RemoteSettings } from './store'

/** Fades out the splash screen from index.html. Called when the 3D scene is ready. */
export function hideSplash() {
  document.getElementById('splash')?.classList.add('hide')
}

export const inr = (n: number) => '₹' + n.toLocaleString('en-IN')

const s = () => appStore.get().settings

/** Price set in the admin, else the one in config.ts, else null ("on request"). */
export function planPrice(planId: string, car: CarType, billing: Billing) {
  const remote = s().prices?.[planId]?.[car]?.[billing]
  if (remote != null) return remote
  return PLANS.find((p) => p.id === planId)?.prices[car][billing] ?? null
}

export function planWashes(planId: string) {
  return s().washes?.[planId] || PLANS.find((p) => p.id === planId)?.washesPerMonth || ''
}

export function addonPrice(id: string) {
  const remote = s().addons?.[id]
  if (remote != null) return remote
  return ADDONS.find((a) => a.id === id)?.price ?? null
}

export const referral = () => s().referral ?? REFERRAL
export const whatsappNumber = () => s().whatsapp || BRAND.whatsapp

/** Opens WhatsApp with a pre-filled message to the owner. */
export function openWhatsApp(text: string, to = whatsappNumber()) {
  const base = to ? `https://wa.me/${to}` : 'https://wa.me/'
  window.open(`${base}?text=${encodeURIComponent(text)}`, '_blank', 'noopener')
}

/** Loads admin settings once at start-up. The site keeps working if this fails. */
export async function loadRemoteSettings() {
  const ref = new URLSearchParams(location.search).get('ref')
  if (ref) appStore.set({ refCode: ref.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12) })
  try {
    const r = await fetch('/api/settings', { headers: { Accept: 'application/json' } })
    if (!r.ok || !r.headers.get('content-type')?.includes('json')) return
    const data = (await r.json()) as { db: boolean; settings: RemoteSettings | null }
    appStore.set({ settings: data.settings ?? {}, db: Boolean(data.db) })
  } catch {
    /* offline or API not deployed: config.ts values are used */
  }
}

/** Adds the `in` class when the element scrolls into view. */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.classList.add('in')
          io.disconnect()
        }
      },
      { threshold: 0.15 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return ref
}
