import { useEffect, useState } from 'react'
import { BRAND } from '../config'
import { InstallApp } from './InstallApp'
import { Logo } from './Logo'

const LINKS = [
  { href: '#showroom', label: 'Showroom' },
  { href: '#how', label: 'How it works' },
  { href: '#plans', label: 'Plans' },
  { href: '#faq', label: 'FAQ' },
]

export function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-all ${scrolled ? 'bg-ink/70 backdrop-blur-xl border-b border-white/5' : ''}`}
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
        <a href="#top" aria-label={`${BRAND.name} home`}>
          <Logo />
        </a>
        <div className="hidden items-center gap-7 text-sm text-slate-300 md:flex">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="hover:text-white">
              {l.label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <InstallApp />
          <span className="hidden sm:inline-flex">
            <a href="#book" className="btn-primary !px-5 !py-2 text-sm whitespace-nowrap">
              Book now
            </a>
          </span>
          <button
            className="glass rounded-full p-2 md:hidden"
            aria-label="Menu"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </nav>
      {open && (
        <div className="mx-4 mb-3 grid gap-1 rounded-2xl border border-white/10 bg-ink/95 p-3 md:hidden">
          {[...LINKS, { href: '#book', label: 'Book now' }].map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-xl px-4 py-3 text-white hover:bg-white/5">
              {l.label}
            </a>
          ))}
        </div>
      )}
    </header>
  )
}
