import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { ADDONS, BRAND, CAR_TYPES, PLANS, SERVICE_PINCODES, TIME_SLOTS, WEEK_DAYS } from '../config'
import { addonPrice, inr, openWhatsApp, planPrice, referral } from '../lib'
import { ShareCode } from './Refer'
import { appStore, useApp } from '../store'

/** Today's date in the user's local timezone, as YYYY-MM-DD. */
const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function Label({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <span className="mb-2 flex items-baseline justify-between text-sm font-medium text-slate-300">
      {children}
      {hint && <span className="text-xs font-normal text-slate-500">{hint}</span>}
    </span>
  )
}

function toggle(list: string[], v: string) {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v]
}

type RefState = { status: 'idle' | 'checking' | 'valid' | 'invalid' | 'unverified'; percent: number }

export function Booking() {
  const { carType, planId, billing, refCode: linkCode } = useApp()
  const ref = referral()
  const [refCode, setRefCode] = useState(linkCode)
  const [refState, setRefState] = useState<RefState>({ status: 'idle', percent: 0 })
  const [myCode, setMyCode] = useState('')

  // A ?ref=CODE link fills the code in automatically.
  useEffect(() => {
    if (linkCode) setRefCode(linkCode)
  }, [linkCode])

  // Check the referral code shortly after the customer stops typing.
  useEffect(() => {
    const code = refCode.trim().toUpperCase()
    if (!ref.enabled || code.length < 4) return setRefState({ status: 'idle', percent: 0 })
    setRefState({ status: 'checking', percent: 0 })
    const ctrl = new AbortController()
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/referral?code=${encodeURIComponent(code)}`, { signal: ctrl.signal })
        if (!r.ok || !r.headers.get('content-type')?.includes('json')) throw new Error()
        const d = (await r.json()) as { valid: boolean | null; friendPercent?: number }
        const percent = d.friendPercent ?? ref.friendPercent
        setRefState({ status: d.valid === null ? 'unverified' : d.valid ? 'valid' : 'invalid', percent })
      } catch (e) {
        if ((e as Error).name !== 'AbortError') setRefState({ status: 'unverified', percent: ref.friendPercent })
      }
    }, 500)
    return () => {
      clearTimeout(t)
      ctrl.abort()
    }
  }, [refCode, ref.enabled, ref.friendPercent])
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [model, setModel] = useState('')
  const [cars, setCars] = useState(1)
  const [addons, setAddons] = useState<string[]>([])
  const [pincode, setPincode] = useState('')
  const [address, setAddress] = useState('')
  const [mapLink, setMapLink] = useState('')
  const [locating, setLocating] = useState(false)
  const [start, setStart] = useState(today())
  const [days, setDays] = useState<string[]>([])
  const [slot, setSlot] = useState(TIME_SLOTS[1])
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const pinChecked = SERVICE_PINCODES.length > 0 && /^\d{6}$/.test(pincode)
  const pinOk = pinChecked && SERVICE_PINCODES.includes(pincode)

  const price = planPrice(planId, carType, billing)
  const plan = PLANS.find((p) => p.id === planId)
  const refApplies = refState.status === 'valid' || refState.status === 'unverified'
  const discount = refApplies && price != null ? Math.round((planPrice(planId, carType, 'monthly') ?? 0) * (refState.percent / 100)) : 0

  function locate() {
    if (!navigator.geolocation) return setError('Location is not available on this device.')
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        setMapLink(`https://maps.google.com/?q=${latitude.toFixed(6)},${longitude.toFixed(6)}`)
        setLocating(false)
      },
      () => {
        setError('Could not get your location. Please type the address.')
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    const digits = phone.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '')
    if (name.trim().length < 2) return setError('Please enter your name.')
    if (!/^[6-9]\d{9}$/.test(digits)) return setError('Please enter a valid 10-digit mobile number.')
    if (address.trim().length < 8 && !mapLink) return setError('Please add your address or share your location.')
    if (!/^\d{6}$/.test(pincode)) return setError('Please enter a 6-digit pincode.')

    const car = CAR_TYPES.find((c) => c.id === carType)?.label
    const code = refApplies ? refCode.trim().toUpperCase() : ''
    const lines = [
      `*New car wash booking*`,
      ``,
      `Name: ${name.trim()}`,
      `Phone: ${digits}`,
      `Car: ${car}${model.trim() ? ` · ${model.trim()}` : ''}${cars > 1 ? ` · ${cars} cars` : ''}`,
      `Plan: ${plan?.name} (${billing})${price != null ? ` · ${inr(price)}` : ' · price to confirm'}`,
      code ? `Referral code: ${code} (${refState.percent}% off first month${refState.status === 'unverified' ? ', please verify' : ''})` : '',
      addons.length ? `Add-ons: ${addons.map((id) => ADDONS.find((a) => a.id === id)?.name).join(', ')}` : '',
      `Start date: ${start}`,
      days.length ? `Preferred days: ${days.join(', ')}` : '',
      `Time slot: ${slot}`,
      `Address: ${address.trim() || '-'}`,
      `Pincode: ${pincode}`,
      mapLink ? `Location: ${mapLink}` : '',
      notes.trim() ? `Notes: ${notes.trim()}` : '',
    ].filter((l) => l !== '')
    // Open WhatsApp straight away (inside the tap, so phones don't block it),
    // and save the booking for the admin in the background.
    openWhatsApp(lines.join('\n'))
    setSent(true)
    fetch('/api/bookings', {
      method: 'POST',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(), phone: digits, carType, model: model.trim(), cars,
        planId, planName: plan?.name, billing, price,
        addons: addons.map((id) => ADDONS.find((a) => a.id === id)?.name ?? id),
        pincode, address: address.trim(), mapLink, start, days, slot, notes: notes.trim(), refCode: code,
      }),
    })
      .then((r) => (r.ok && r.headers.get('content-type')?.includes('json') ? r.json() : null))
      .then((d: { myCode?: string } | null) => d?.myCode && setMyCode(d.myCode))
      .catch(() => {})
  }

  return (
    <section id="book" className="px-5 py-24">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <p className="font-display text-sm font-semibold tracking-widest text-neon uppercase">Book</p>
          <h2 className="mt-3 font-display text-3xl font-bold text-white md:text-5xl">Start your plan.</h2>
          <p className="mt-3 text-slate-400">Fill this once. Your booking opens in WhatsApp, ready to send.</p>
        </div>

        <form onSubmit={submit} className="panel mt-10 grid gap-6 p-6 md:p-8" noValidate>
          <div className="grid gap-4 md:grid-cols-2">
            <label>
              <Label>Your name</Label>
              <input className="field" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
            </label>
            <label>
              <Label>Mobile number</Label>
              <input className="field" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="tel" placeholder="10-digit number" />
            </label>
          </div>

          <div>
            <Label>Car type</Label>
            <div className="grid grid-cols-3 gap-2">
              {CAR_TYPES.map((c) => (
                <button type="button" key={c.id} onClick={() => appStore.set({ carType: c.id })} className={`chip ${carType === c.id ? 'chip-on' : 'chip-off'}`}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-[1fr_auto]">
            <label>
              <Label hint="optional">Car model & colour</Label>
              <input className="field" value={model} onChange={(e) => setModel(e.target.value)} placeholder="e.g. Honda City, white" />
            </label>
            <label>
              <Label>Cars</Label>
              <select className="field md:w-28" value={cars} onChange={(e) => setCars(Number(e.target.value))}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n} className="bg-ink">
                    {n}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label>
              <Label>Plan</Label>
              <select className="field" value={planId} onChange={(e) => appStore.set({ planId: e.target.value })}>
                {PLANS.map((p) => (
                  <option key={p.id} value={p.id} className="bg-ink">
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <div>
              <Label>Billing</Label>
              <div className="grid grid-cols-2 gap-2">
                {(['monthly', 'yearly'] as const).map((b) => (
                  <button type="button" key={b} onClick={() => appStore.set({ billing: b })} className={`chip capitalize ${billing === b ? 'chip-on' : 'chip-off'}`}>
                    {b}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <p className="-mt-3 text-sm text-slate-400">
            {plan?.name} · {billing}:{' '}
            <span className="font-semibold text-white">{price != null ? inr(price) : 'price confirmed on WhatsApp'}</span>
            {discount > 0 && <span className="ml-2 font-semibold text-emerald-400">− {inr(discount)} referral discount on first month</span>}
          </p>

          {ref.enabled && (
            <label>
              <Label hint="optional">Referral code</Label>
              <input
                className="field uppercase"
                value={refCode}
                onChange={(e) => setRefCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12))}
                placeholder="Got a code from a friend?"
                autoComplete="off"
              />
              {refState.status === 'checking' && <span className="mt-2 block text-xs text-slate-400">Checking…</span>}
              {refState.status === 'valid' && <span className="mt-2 block text-xs text-emerald-400">✓ Code applied: {refState.percent}% off your first month</span>}
              {refState.status === 'unverified' && <span className="mt-2 block text-xs text-amber-400">Code noted. {refState.percent}% off after we verify it.</span>}
              {refState.status === 'invalid' && <span className="mt-2 block text-xs text-red-300">This code is not valid.</span>}
            </label>
          )}

          <div>
            <Label hint="optional">Add-ons</Label>
            <div className="flex flex-wrap gap-2">
              {ADDONS.map((a) => (
                <button type="button" key={a.id} onClick={() => setAddons(toggle(addons, a.id))} className={`chip ${addons.includes(a.id) ? 'chip-on' : 'chip-off'}`}>
                  {a.name}
                  {addonPrice(a.id) != null && ` · ${inr(addonPrice(a.id)!)}`}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-[1fr_2fr]">
            <label>
              <Label>Pincode</Label>
              <input className="field" value={pincode} onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" placeholder="6 digits" />
              {pinChecked && (
                <span className={`mt-2 block text-xs ${pinOk ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {pinOk ? '✓ We serve your area' : 'Not in our list yet. Send anyway and we will check.'}
                </span>
              )}
            </label>
            <label>
              <Label>Address / parking spot</Label>
              <input className="field" value={address} onChange={(e) => setAddress(e.target.value)} autoComplete="street-address" placeholder="Flat, society, landmark, parking no." />
            </label>
          </div>
          <div className="-mt-2">
            <button type="button" onClick={locate} className="btn-ghost !py-2 text-sm" disabled={locating}>
              📍 {locating ? 'Getting location…' : mapLink ? 'Location added ✓' : 'Share my current location'}
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label>
              <Label>Start date</Label>
              <input type="date" className="field [color-scheme:dark]" min={today()} value={start} onChange={(e) => setStart(e.target.value)} />
            </label>
            <label>
              <Label>Time slot</Label>
              <select className="field" value={slot} onChange={(e) => setSlot(e.target.value)}>
                {TIME_SLOTS.map((t) => (
                  <option key={t} className="bg-ink">
                    {t}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div>
            <Label hint="optional">Preferred wash days</Label>
            <div className="flex flex-wrap gap-2">
              {WEEK_DAYS.map((d) => (
                <button type="button" key={d} onClick={() => setDays(toggle(days, d))} className={`chip !px-3 ${days.includes(d) ? 'chip-on' : 'chip-off'}`}>
                  {d}
                </button>
              ))}
            </div>
          </div>

          <label>
            <Label hint="optional">Notes</Label>
            <textarea className="field min-h-24" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Gate code, parking level, anything else" />
          </label>

          {error && <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-300" role="alert">{error}</p>}
          {sent && !error && (
            <div className="rounded-xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
              WhatsApp opened. Tap <b>Send</b> there to confirm your booking with {BRAND.name}.
              {myCode && <ShareCode code={myCode} />}
            </div>
          )}

          <button type="submit" className="btn-primary w-full text-lg">
            Book on WhatsApp
          </button>
        </form>
      </div>
    </section>
  )
}
