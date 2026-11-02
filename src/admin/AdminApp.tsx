import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { ADDONS, CAR_TYPES, PLANS, REFERRAL, type Billing, type CarType } from '../config'
import type { RemoteSettings } from '../store'
import { api, ApiError, clearPin, getPin, setPin, type Booking, type Referrer, type Status } from './api'

const STATUSES: { id: Status; label: string; cls: string }[] = [
  { id: 'new', label: 'New', cls: 'bg-cyan-500/15 text-cyan-300' },
  { id: 'confirmed', label: 'Confirmed', cls: 'bg-blue-500/15 text-blue-300' },
  { id: 'active', label: 'Active plan', cls: 'bg-emerald-500/15 text-emerald-300' },
  { id: 'paused', label: 'Paused', cls: 'bg-amber-500/15 text-amber-300' },
  { id: 'cancelled', label: 'Cancelled', cls: 'bg-red-500/15 text-red-300' },
]
const inr = (n: number) => '₹' + n.toLocaleString('en-IN')
const when = (t: number) => new Date(t).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })

function Setup({ message }: { message: string }) {
  return (
    <div className="panel mx-auto mt-6 max-w-xl p-6 text-sm text-slate-300">
      <p className="font-semibold text-amber-300">{message}</p>
      <ol className="mt-4 list-decimal space-y-2 pl-5">
        <li>Vercel → your project → <b>Storage</b> → <b>Connect Database</b> → <b>Upstash for Redis</b> (free plan) → connect to this project.</li>
        <li>Vercel → <b>Settings → Environment Variables</b> → add <code className="text-neon">ADMIN_PIN</code> (your secret PIN, 6+ digits).</li>
        <li>Optional: add <code className="text-neon">REFERRAL_SECRET</code> (any long random text) so referral codes can't be guessed.</li>
        <li><b>Deployments</b> → latest → <b>Redeploy</b>. Then open this page again.</li>
      </ol>
    </div>
  )
}

function Login({ onDone }: { onDone: () => void }) {
  const [pin, setP] = useState('')
  const [error, setError] = useState('')
  const [setup, setSetup] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    setPin(pin)
    try {
      await api.bookings()
      onDone()
    } catch (err) {
      clearPin()
      const ae = err as ApiError
      if (ae.status === 503 || ae.status === 0) setSetup(ae.message)
      else setError(ae.message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="min-h-svh px-5 pt-20">
      <form onSubmit={submit} className="panel mx-auto max-w-sm p-7 text-center">
        <img src="/logo.svg" alt="" className="mx-auto h-16 w-16 rounded-2xl" />
        <h1 className="mt-4 font-display text-2xl font-bold text-white">CW Admin</h1>
        <input
          className="field mt-6 text-center text-xl tracking-[0.4em]"
          type="password"
          inputMode="numeric"
          autoComplete="current-password"
          placeholder="PIN"
          value={pin}
          onChange={(e) => setP(e.target.value)}
          autoFocus
        />
        {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
        <button className="btn-primary mt-5 w-full" disabled={busy || !pin}>
          {busy ? 'Checking…' : 'Log in'}
        </button>
      </form>
      {setup && <Setup message={setup} />}
    </div>
  )
}

function exportCsv(rows: Booking[]) {
  const cols: (keyof Booking)[] = ['createdAt', 'status', 'name', 'phone', 'carType', 'model', 'cars', 'planName', 'billing', 'price', 'addons', 'pincode', 'address', 'mapLink', 'start', 'days', 'slot', 'notes', 'refCode', 'referrerPhone', 'friendPercent', 'referrerPercent', 'rewardGiven', 'adminNote']
  const esc = (v: unknown) => `"${String(Array.isArray(v) ? v.join(' | ') : v ?? '').replace(/"/g, '""')}"`
  const csv = [cols.join(','), ...rows.map((r) => cols.map((c) => esc(c === 'createdAt' ? new Date(r.createdAt).toISOString() : r[c])).join(','))].join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv' }))
  a.download = `cw-bookings-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
}

function BookingCard({ b, onChange, onDelete }: { b: Booking; onChange: (b: Booking) => void; onDelete: () => void }) {
  const [busy, setBusy] = useState(false)
  const status = STATUSES.find((s) => s.id === b.status) ?? STATUSES[0]
  async function patch(p: Partial<Booking>) {
    setBusy(true)
    try {
      const { booking } = await api.update(b.id, p)
      onChange(booking)
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <article className={`panel p-5 ${busy ? 'opacity-60' : ''}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display text-lg font-bold text-white">{b.name}</p>
          <p className="text-xs text-slate-500">{when(b.createdAt)} · #{b.id}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status.cls}`}>{status.label}</span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <a className="btn-ghost !px-4 !py-1.5 text-sm" href={`tel:+91${b.phone}`}>📞 {b.phone}</a>
        <a className="btn-ghost !px-4 !py-1.5 text-sm" href={`https://wa.me/91${b.phone}`} target="_blank" rel="noopener">WhatsApp</a>
        {b.mapLink && <a className="btn-ghost !px-4 !py-1.5 text-sm" href={b.mapLink} target="_blank" rel="noopener">📍 Map</a>}
      </div>

      <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
        <dt className="text-slate-500">Car</dt>
        <dd className="text-slate-200">{CAR_TYPES.find((c) => c.id === b.carType)?.label ?? b.carType}{b.model && ` · ${b.model}`}{b.cars > 1 && ` · ${b.cars} cars`}</dd>
        <dt className="text-slate-500">Plan</dt>
        <dd className="text-slate-200">{b.planName} ({b.billing}){b.price != null && ` · ${inr(b.price)}`}</dd>
        {b.addons.length > 0 && (<><dt className="text-slate-500">Add-ons</dt><dd className="text-slate-200">{b.addons.join(', ')}</dd></>)}
        <dt className="text-slate-500">Address</dt>
        <dd className="text-slate-200">{b.address || '-'} · {b.pincode}</dd>
        <dt className="text-slate-500">Schedule</dt>
        <dd className="text-slate-200">From {b.start || '-'} · {b.slot}{b.days.length > 0 && ` · ${b.days.join(', ')}`}</dd>
        {b.notes && (<><dt className="text-slate-500">Notes</dt><dd className="text-slate-200">{b.notes}</dd></>)}
      </dl>

      {b.refCode && (
        <div className="mt-4 rounded-xl border border-neon/30 bg-neon/5 p-3 text-sm">
          <p className="text-slate-200">
            Referred with <b className="text-neon">{b.refCode}</b> by <a className="underline" href={`https://wa.me/91${b.referrerPhone}`} target="_blank" rel="noopener">{b.referrerPhone}</a>
          </p>
          <p className="mt-1 text-slate-400">Customer gets {b.friendPercent}% off first month · Referrer earns {b.referrerPercent}%</p>
          <label className="mt-2 flex items-center gap-2 text-slate-200">
            <input type="checkbox" className="h-4 w-4 accent-cyan-400" checked={b.rewardGiven} onChange={(e) => patch({ rewardGiven: e.target.checked })} />
            Referrer reward given
          </label>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <select className="field !w-auto !py-2 text-sm" value={b.status} onChange={(e) => patch({ status: e.target.value as Status })}>
          {STATUSES.map((s) => (
            <option key={s.id} value={s.id} className="bg-ink">{s.label}</option>
          ))}
        </select>
        <button
          className="btn-ghost !px-4 !py-2 text-sm"
          onClick={() => {
            const note = prompt('Note for this booking', b.adminNote)
            if (note !== null) patch({ adminNote: note })
          }}
        >
          {b.adminNote ? '📝 Edit note' : '📝 Add note'}
        </button>
        <button className="ml-auto text-sm text-red-300 hover:underline" onClick={() => confirm(`Delete booking of ${b.name}?`) && onDelete()}>
          Delete
        </button>
      </div>
      {b.adminNote && <p className="mt-2 text-sm text-amber-200/80">📝 {b.adminNote}</p>}
    </article>
  )
}

function Bookings({ bookings, setBookings }: { bookings: Booking[]; setBookings: (f: (b: Booking[]) => Booking[]) => void }) {
  const [filter, setFilter] = useState<Status | 'all'>('all')
  const [q, setQ] = useState('')
  const shown = useMemo(() => {
    const s = q.trim().toLowerCase()
    return bookings.filter(
      (b) => (filter === 'all' || b.status === filter) && (!s || `${b.name} ${b.phone} ${b.address} ${b.pincode} ${b.refCode}`.toLowerCase().includes(s)),
    )
  }, [bookings, filter, q])
  return (
    <>
      <div className="flex flex-wrap gap-2">
        {(['all', ...STATUSES.map((s) => s.id)] as const).map((id) => (
          <button key={id} onClick={() => setFilter(id)} className={`chip ${filter === id ? 'chip-on' : 'chip-off'}`}>
            {id === 'all' ? 'All' : STATUSES.find((s) => s.id === id)?.label} ({id === 'all' ? bookings.length : bookings.filter((b) => b.status === id).length})
          </button>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <input className="field" placeholder="Search name, phone, address, pincode, code" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn-ghost shrink-0 text-sm" onClick={() => exportCsv(shown)}>Export CSV</button>
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {shown.map((b) => (
          <BookingCard
            key={b.id}
            b={b}
            onChange={(nb) => setBookings((all) => all.map((x) => (x.id === nb.id ? nb : x)))}
            onDelete={async () => {
              try {
                await api.remove(b.id)
                setBookings((all) => all.filter((x) => x.id !== b.id))
              } catch (e) {
                alert((e as Error).message)
              }
            }}
          />
        ))}
        {!shown.length && <p className="text-slate-400">No bookings here yet.</p>}
      </div>
    </>
  )
}

function Referrals({ referrers, bookings }: { referrers: Referrer[]; bookings: Booking[] }) {
  const pending = bookings.filter((b) => b.refCode && b.status === 'active' && !b.rewardGiven)
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="panel p-5">
        <h3 className="font-display text-lg font-bold text-white">Rewards to give ({pending.length})</h3>
        <p className="mt-1 text-sm text-slate-400">Referred customers with an active plan whose referrer has not got the reward yet.</p>
        <ul className="mt-4 space-y-3 text-sm">
          {pending.map((b) => (
            <li key={b.id} className="rounded-xl bg-white/[0.03] p-3">
              <b className="text-white">{b.referrerPhone}</b> earns <b className="text-emerald-300">{b.referrerPercent}%</b> for referring {b.name}
              <span className="text-slate-500"> ({b.refCode})</span>
            </li>
          ))}
          {!pending.length && <li className="text-slate-500">Nothing pending.</li>}
        </ul>
      </div>
      <div className="panel p-5">
        <h3 className="font-display text-lg font-bold text-white">Top referrers</h3>
        <table className="mt-4 w-full text-left text-sm">
          <thead className="text-slate-500">
            <tr><th className="py-1">Code</th><th>Phone</th><th className="text-right">Bookings</th></tr>
          </thead>
          <tbody>
            {referrers.map((r) => (
              <tr key={r.code} className="border-t border-white/5">
                <td className="py-2 font-semibold text-neon">{r.code}</td>
                <td className="text-slate-200">{r.phone}</td>
                <td className="text-right text-white">{r.uses}</td>
              </tr>
            ))}
            {!referrers.length && <tr><td colSpan={3} className="py-2 text-slate-500">No referrals yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function NumberInput({ value, onChange, placeholder, suffix }: { value: number | null | undefined; onChange: (v: number | null) => void; placeholder?: string; suffix?: string }) {
  return (
    <div className="relative">
      <input
        className="field !py-2 pr-10"
        inputMode="numeric"
        placeholder={placeholder ?? '—'}
        value={value ?? ''}
        onChange={(e) => {
          const d = e.target.value.replace(/\D/g, '')
          onChange(d === '' ? null : Number(d))
        }}
      />
      {suffix && <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-slate-500">{suffix}</span>}
    </div>
  )
}

function Settings() {
  const [s, setS] = useState<RemoteSettings | null>(null)
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api.settings().then((d) => {
      const cur = d.settings || {}
      // Pre-fill with what the site shows today (config.ts) so nothing is lost on first save.
      const prices: NonNullable<RemoteSettings['prices']> = {}
      for (const p of PLANS) {
        prices[p.id] = {} as Record<CarType, Record<Billing, number | null>>
        for (const c of CAR_TYPES) {
          prices[p.id][c.id] = {
            monthly: cur.prices?.[p.id]?.[c.id]?.monthly ?? p.prices[c.id].monthly,
            yearly: cur.prices?.[p.id]?.[c.id]?.yearly ?? p.prices[c.id].yearly,
          }
        }
      }
      setS({
        whatsapp: cur.whatsapp ?? '',
        referral: cur.referral ?? REFERRAL,
        prices,
        washes: Object.fromEntries(PLANS.map((p) => [p.id, cur.washes?.[p.id] ?? p.washesPerMonth])),
        addons: Object.fromEntries(ADDONS.map((a) => [a.id, cur.addons?.[a.id] ?? a.price])),
      })
    })
  }, [])

  if (!s) return <p className="text-slate-400">Loading…</p>
  const ref = s.referral!

  async function save() {
    setBusy(true)
    setMsg('')
    try {
      const { settings } = await api.saveSettings(s!)
      setS((cur) => ({ ...cur, ...settings }))
      setMsg('✓ Saved. The website shows the new values on the next page load.')
    } catch (e) {
      setMsg('✗ ' + (e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid gap-5">
      <section className="panel p-5">
        <h3 className="font-display text-lg font-bold text-white">Refer & earn</h3>
        <label className="mt-4 flex items-center gap-3 text-slate-200">
          <input type="checkbox" className="h-5 w-5 accent-cyan-400" checked={ref.enabled} onChange={(e) => setS({ ...s, referral: { ...ref, enabled: e.target.checked } })} />
          Referral programme on
        </label>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm text-slate-300">
            New customer's discount (first month)
            <div className="mt-2"><NumberInput value={ref.friendPercent} suffix="%" onChange={(v) => setS({ ...s, referral: { ...ref, friendPercent: Math.min(v ?? 0, 100) } })} /></div>
          </label>
          <label className="text-sm text-slate-300">
            Referrer's reward (per friend)
            <div className="mt-2"><NumberInput value={ref.referrerPercent} suffix="%" onChange={(v) => setS({ ...s, referral: { ...ref, referrerPercent: Math.min(v ?? 0, 100) } })} /></div>
          </label>
        </div>
      </section>

      <section className="panel p-5">
        <h3 className="font-display text-lg font-bold text-white">WhatsApp number for bookings</h3>
        <input
          className="field mt-3"
          inputMode="tel"
          placeholder="e.g. 919876543210"
          value={s.whatsapp}
          onChange={(e) => setS({ ...s, whatsapp: e.target.value.replace(/\D/g, '').slice(0, 15) })}
        />
        <p className="mt-2 text-xs text-slate-500">With country code. A 10-digit number gets 91 added automatically.</p>
      </section>

      <section className="panel overflow-x-auto p-5">
        <h3 className="font-display text-lg font-bold text-white">Plan prices (₹)</h3>
        <p className="mt-1 text-sm text-slate-400">Leave empty to show "Price on request".</p>
        {PLANS.map((p) => (
          <div key={p.id} className="mt-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold text-neon">{p.name}</p>
              <input
                className="field !w-56 !py-2 text-sm"
                placeholder="e.g. 8 washes / month"
                value={s.washes?.[p.id] ?? ''}
                onChange={(e) => setS({ ...s, washes: { ...s.washes, [p.id]: e.target.value } })}
              />
            </div>
            <div className="mt-2 grid min-w-[420px] grid-cols-[110px_1fr_1fr] items-center gap-2 text-sm">
              <span />
              <span className="text-slate-500">Monthly</span>
              <span className="text-slate-500">Yearly</span>
              {CAR_TYPES.map((c) => (
                <div key={c.id} className="contents">
                  <span className="text-slate-300">{c.label}</span>
                  {(['monthly', 'yearly'] as const).map((b) => (
                    <NumberInput
                      key={b}
                      value={s.prices?.[p.id]?.[c.id]?.[b]}
                      onChange={(v) =>
                        setS({
                          ...s,
                          prices: { ...s.prices, [p.id]: { ...s.prices![p.id], [c.id]: { ...s.prices![p.id][c.id], [b]: v } } },
                        })
                      }
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="panel p-5">
        <h3 className="font-display text-lg font-bold text-white">Add-on prices (₹)</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {ADDONS.map((a) => (
            <label key={a.id} className="grid grid-cols-[1fr_120px] items-center gap-3 text-sm text-slate-300">
              {a.name}
              <NumberInput value={s.addons?.[a.id]} onChange={(v) => setS({ ...s, addons: { ...s.addons, [a.id]: v } })} />
            </label>
          ))}
        </div>
      </section>

      <div className="sticky bottom-4 z-10 flex items-center gap-4 rounded-2xl border border-white/10 bg-ink/90 p-4 backdrop-blur-xl">
        <button className="btn-primary" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save settings'}</button>
        {msg && <p className={`text-sm ${msg.startsWith('✓') ? 'text-emerald-300' : 'text-red-300'}`}>{msg}</p>}
      </div>
    </div>
  )
}

type Tab = 'bookings' | 'referrals' | 'settings'

export function AdminApp() {
  const [authed, setAuthed] = useState(Boolean(getPin()))
  const [tab, setTab] = useState<Tab>('bookings')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [referrers, setReferrers] = useState<Referrer[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const d = await api.bookings()
      setBookings(d.bookings)
      setReferrers(d.referrers)
    } catch (e) {
      const ae = e as ApiError
      if (ae.status === 401) {
        clearPin()
        setAuthed(false)
      } else setError(ae.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authed) load()
  }, [authed, load])

  if (!authed) return <Login onDone={() => setAuthed(true)} />

  const newCount = bookings.filter((b) => b.status === 'new').length
  return (
    <div className="mx-auto min-h-svh max-w-6xl px-4 pt-6 pb-16" style={{ paddingTop: 'max(1.5rem, env(safe-area-inset-top))' }}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt="" className="h-10 w-10 rounded-xl" />
          <div>
            <p className="font-display text-xl font-bold text-white">CW Admin</p>
            <p className="text-xs text-slate-500">{bookings.length} bookings · {newCount} new</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost !px-4 !py-2 text-sm" onClick={load} disabled={loading}>{loading ? '…' : 'Refresh'}</button>
          <a className="btn-ghost !px-4 !py-2 text-sm" href="/" target="_blank" rel="noopener">View site</a>
          <button className="btn-ghost !px-4 !py-2 text-sm" onClick={() => { clearPin(); setAuthed(false) }}>Log out</button>
        </div>
      </header>

      <nav className="glass mt-6 inline-flex rounded-full p-1">
        {(['bookings', 'referrals', 'settings'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-full px-5 py-2 text-sm font-semibold capitalize ${tab === t ? 'bg-neon text-ink' : 'text-slate-300'}`}>
            {t}
          </button>
        ))}
      </nav>

      {error && <Setup message={error} />}

      <main className="mt-6">
        {tab === 'bookings' && <Bookings bookings={bookings} setBookings={setBookings} />}
        {tab === 'referrals' && <Referrals referrers={referrers} bookings={bookings} />}
        {tab === 'settings' && <Settings />}
      </main>
    </div>
  )
}
