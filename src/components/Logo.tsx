import { BRAND } from '../config'

/** CW mark + wordmark. Used in the nav, footer and app loading screen. */
export function Logo({ size = 36, sub = true }: { size?: number; sub?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <img src="/logo.svg" alt="" width={size} height={size} className="rounded-[22%] shadow-[0_0_24px_-6px_rgb(34_211_238_/_0.7)]" />
      <span className="flex flex-col leading-none">
        <span className="font-display text-xl font-extrabold tracking-tight text-white">{BRAND.name}</span>
        {sub && <span className="mt-1 text-[10px] font-semibold tracking-[0.22em] text-neon uppercase">{BRAND.descriptor}</span>}
      </span>
    </span>
  )
}
