import { useState } from 'react'
import { ADDONS, BRAND, FAQ, HOW_IT_WORKS, SERVICE_AREAS, WHY_US } from '../config'
import { inr, useReveal } from '../lib'
import { Logo } from './Logo'

function Heading({ kicker, title }: { kicker: string; title: string }) {
  const ref = useReveal<HTMLDivElement>()
  return (
    <div ref={ref} className="reveal text-center">
      <p className="font-display text-sm font-semibold tracking-widest text-neon uppercase">{kicker}</p>
      <h2 className="mt-3 font-display text-3xl font-bold text-white md:text-5xl">{title}</h2>
    </div>
  )
}

function Card({ i, title, text, step }: { i: number; title: string; text: string; step?: boolean }) {
  const ref = useReveal<HTMLDivElement>()
  return (
    <div ref={ref} className="reveal panel p-6" style={{ transitionDelay: `${i * 80}ms` }}>
      <span className="font-display text-sm font-bold text-neon">{step ? `Step ${i + 1}` : `0${i + 1}`}</span>
      <h3 className="mt-3 font-display text-lg font-bold text-white">{title}</h3>
      <p className="mt-2 text-sm text-slate-400">{text}</p>
    </div>
  )
}

export function WhyUs() {
  return (
    <section className="px-5 py-24">
      <div className="mx-auto max-w-6xl">
        <Heading kicker="Why us" title="A washing centre that comes to you." />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {WHY_US.map((w, i) => (
            <Card key={w.title} i={i} {...w} />
          ))}
        </div>
      </div>
    </section>
  )
}

export function HowItWorks() {
  return (
    <section id="how" className="px-5 py-24">
      <div className="mx-auto max-w-6xl">
        <Heading kicker="How it works" title="Set it once. Forget about it." />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {HOW_IT_WORKS.map((w, i) => (
            <Card key={w.title} i={i} step {...w} />
          ))}
        </div>
      </div>
    </section>
  )
}

export function Addons() {
  return (
    <section id="addons" className="px-5 py-24">
      <div className="mx-auto max-w-6xl">
        <Heading kicker="Add-ons" title="Need a little extra?" />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ADDONS.map((a) => (
            <div key={a.id} className="panel flex items-center justify-between p-5">
              <span className="font-medium text-white">{a.name}</span>
              <span className="text-sm text-neon">{a.price != null ? inr(a.price) : 'On request'}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function Faq() {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <section id="faq" className="px-5 py-24">
      <div className="mx-auto max-w-3xl">
        <Heading kicker="FAQ" title="Questions, answered." />
        <div className="mt-12 space-y-3">
          {FAQ.map((f, i) => (
            <div key={f.q} className="panel overflow-hidden">
              <button
                className="flex w-full items-center justify-between gap-4 p-5 text-left font-medium text-white"
                aria-expanded={open === i}
                onClick={() => setOpen(open === i ? null : i)}
              >
                {f.q}
                <span className={`text-neon transition ${open === i ? 'rotate-45' : ''}`}>+</span>
              </button>
              {open === i && <p className="px-5 pb-5 text-slate-400">{f.a}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/5 bg-ink/90 px-5 pt-12 pb-28 backdrop-blur-xl">
      <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-3">
        <div>
          <Logo size={44} />
          <p className="mt-3 text-sm text-slate-400">{BRAND.tagline}</p>
        </div>
        <div className="text-sm text-slate-400">
          <p className="font-semibold text-white">Timings</p>
          <p className="mt-2">{BRAND.hours}</p>
          {BRAND.phoneDisplay && <p className="mt-2">{BRAND.phoneDisplay}</p>}
        </div>
        <div className="text-sm text-slate-400">
          <p className="font-semibold text-white">We serve</p>
          <p className="mt-2">
            {SERVICE_AREAS.length ? SERVICE_AREAS.join(' · ') : BRAND.city || 'Ask us on WhatsApp for your area'}
          </p>
        </div>
      </div>
      <p className="mx-auto mt-10 max-w-6xl text-xs text-slate-600">
        © {new Date().getFullYear()} {BRAND.name}
      </p>
    </footer>
  )
}
