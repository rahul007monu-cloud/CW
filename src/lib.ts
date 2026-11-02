import { useEffect, useRef } from 'react'
import { BRAND, PLANS, type Billing, type CarType } from './config'

/** Fades out the splash screen from index.html. Called when the 3D scene is ready. */
export function hideSplash() {
  document.getElementById('splash')?.classList.add('hide')
}

export const inr = (n: number) => '₹' + n.toLocaleString('en-IN')

export function planPrice(planId: string, car: CarType, billing: Billing) {
  return PLANS.find((p) => p.id === planId)?.prices[car][billing] ?? null
}

/** Opens WhatsApp with a pre-filled message to the owner. */
export function openWhatsApp(text: string) {
  const base = BRAND.whatsapp ? `https://wa.me/${BRAND.whatsapp}` : 'https://wa.me/'
  window.open(`${base}?text=${encodeURIComponent(text)}`, '_blank', 'noopener')
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
