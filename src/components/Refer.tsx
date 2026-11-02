import { useState, type FormEvent } from 'react'
import { BRAND } from '../config'
import { referral, useReveal } from '../lib'
import { useApp } from '../store'

function shareLink(code: string) {
  return `${location.origin}/?ref=${code}#book`
}

/** Shows a referral code with copy + WhatsApp share buttons. */
export function ShareCode({ code }: { code: string }) {
  const ref = referral()
  const [copied, setCopied] = useState(false)
  const text = `I get my car washed at home by ${BRAND.name}. Use my code ${code} and get ${ref.friendPercent}% off your first month: ${shareLink(code)}`
  return (
    <div className="mt-4 rounded-2xl border border-neon/40 bg-neon/10 p-4 text-left text-slate-200">
      <p className="text-xs tracking-widest text-neon uppercase">Your referral code</p>
      <p className="mt-1 font-display text-3xl font-bold tracking-widest text-white">{code}</p>
      <p className="mt-1 text-sm text-slate-300">
        Friend gets <b>{ref.friendPercent}% off</b> the first month. You get <b>{ref.referrerPercent}% off</b> when their plan starts.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <a className="btn-primary !py-2 text-sm" href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener">
          Share on WhatsApp
        </a>
        <button
          type="button"
          className="btn-ghost !py-2 text-sm"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(shareLink(code))
              setCopied(true)
              setTimeout(() => setCopied(false), 2000)
            } catch {
              /* clipboard blocked: the code is visible anyway */
            }
          }}
        >
          {copied ? 'Copied ✓' : 'Copy link'}
        </button>
      </div>
    </div>
  )
}

/** "Refer & earn" section. Needs the database; hidden when it is off. */
export function Refer() {
  const { db } = useApp()
  const ref = referral()
  const head = useReveal<HTMLDivElement>()
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (!ref.enabled || !db) return null

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const r = await fetch('/api/referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Something went wrong')
      setCode(d.code)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section id="refer" className="px-5 py-24">
      <div className="mx-auto max-w-3xl">
        <div ref={head} className="reveal text-center">
          <p className="font-display text-sm font-semibold tracking-widest text-neon uppercase">Refer & earn</p>
          <h2 className="mt-3 font-display text-3xl font-bold text-white md:text-5xl">
            Give {ref.friendPercent}%. Get {ref.referrerPercent}%.
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-slate-400">
            Share your code with friends and neighbours. They get {ref.friendPercent}% off their first month, and you get{' '}
            {ref.referrerPercent}% off your next bill for every friend who starts a plan.
          </p>
        </div>
        <div className="panel mx-auto mt-10 max-w-lg p-6">
          {code ? (
            <ShareCode code={code} />
          ) : (
            <form onSubmit={submit} className="grid gap-3">
              <label className="text-sm font-medium text-slate-300" htmlFor="ref-phone">
                Your mobile number
              </label>
              <input
                id="ref-phone"
                className="field"
                inputMode="tel"
                autoComplete="tel"
                placeholder="10-digit number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              {error && <p className="text-sm text-red-300">{error}</p>}
              <button className="btn-primary" disabled={busy}>
                {busy ? 'Creating…' : 'Get my referral code'}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
