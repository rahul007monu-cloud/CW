import { CAR_TYPES, PLANS } from '../config'
import { inr, planPrice, planWashes, useReveal } from '../lib'
import { appStore, useApp } from '../store'

function Price({ monthly, yearly, billing }: { monthly: number | null; yearly: number | null; billing: 'monthly' | 'yearly' }) {
  const value = billing === 'monthly' ? monthly : yearly
  if (value == null) {
    return (
      <div>
        <p className="font-display text-2xl font-bold text-white">Price on request</p>
        <p className="text-sm text-slate-400">We confirm on WhatsApp</p>
      </div>
    )
  }
  const saving = billing === 'yearly' && monthly != null ? monthly * 12 - value : 0
  return (
    <div>
      <p className="font-display text-4xl font-bold text-white">
        {inr(value)}
        <span className="text-base font-medium text-slate-400"> / {billing === 'monthly' ? 'month' : 'year'}</span>
      </p>
      {billing === 'yearly' && (
        <p className="text-sm text-slate-400">
          ≈ {inr(Math.round(value / 12))} / month
          {saving > 0 && <span className="ml-2 font-semibold text-emerald-400">Save {inr(saving)}</span>}
        </p>
      )}
    </div>
  )
}

export function Plans() {
  const { carType, billing, planId } = useApp()
  const head = useReveal<HTMLDivElement>()
  return (
    <section id="plans" className="px-5 py-24">
      <div className="mx-auto max-w-6xl">
        <div ref={head} className="reveal text-center">
          <p className="font-display text-sm font-semibold tracking-widest text-neon uppercase">Subscription plans</p>
          <h2 className="mt-3 font-display text-3xl font-bold text-white md:text-5xl">One plan. Clean car all month.</h2>
        </div>

        <div className="mt-10 flex flex-col items-center gap-4">
          <div className="glass inline-flex rounded-full p-1">
            {(['monthly', 'yearly'] as const).map((b) => (
              <button
                key={b}
                onClick={() => appStore.set({ billing: b })}
                className={`rounded-full px-6 py-2 text-sm font-semibold capitalize transition ${billing === b ? 'bg-neon text-ink' : 'text-slate-300'}`}
              >
                {b}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {CAR_TYPES.map((c) => (
              <button
                key={c.id}
                onClick={() => appStore.set({ carType: c.id })}
                className={`chip ${carType === c.id ? 'chip-on' : 'chip-off'}`}
              >
                {c.label}
              </button>
            ))}
          </div>
          <p className="text-sm text-slate-400">{CAR_TYPES.find((c) => c.id === carType)?.hint}</p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {PLANS.map((p) => {
            const active = p.id === planId
            return (
              <article
                key={p.id}
                className={`panel relative flex flex-col p-7 transition ${active ? 'border-neon/60 shadow-[0_0_60px_-20px_rgb(34_211_238_/_0.6)]' : ''}`}
              >
                {p.badge && (
                  <span className="absolute -top-3 left-7 rounded-full bg-neon px-3 py-1 text-xs font-bold text-ink">{p.badge}</span>
                )}
                <h3 className="font-display text-xl font-bold text-white">{p.name}</h3>
                {planWashes(p.id) && <p className="mt-1 text-sm text-neon">{planWashes(p.id)}</p>}
                <div className="mt-5">
                  <Price monthly={planPrice(p.id, carType, 'monthly')} yearly={planPrice(p.id, carType, 'yearly')} billing={billing} />
                </div>
                <ul className="mt-6 flex-1 space-y-3 text-sm text-slate-300">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-3">
                      <svg className="mt-0.5 h-4 w-4 shrink-0 text-neon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden>
                        <path d="M5 12l5 5L20 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href="#book"
                  onClick={() => appStore.set({ planId: p.id })}
                  className={`${active ? 'btn-primary' : 'btn-ghost'} mt-7 w-full`}
                >
                  Choose {p.name}
                </a>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
