import { CAR_TYPES } from '../config'
import { appStore, PAINTS, useApp } from '../store'

/** Centre stage: the clean car on the turntable. Pick car type & paint. */
export function ShowroomSection() {
  const { carType, paint } = useApp()
  return (
    <section id="showroom" className="relative flex min-h-[100svh] flex-col justify-between px-5 pt-24 pb-10">
      <div className="mx-auto max-w-2xl text-center">
        <p className="font-display text-sm font-semibold tracking-widest text-neon uppercase">The showroom</p>
        <h2 className="mt-3 font-display text-3xl font-bold text-white md:text-5xl">This is your car after every visit.</h2>
      </div>

      <div className="panel mx-auto w-full max-w-xl p-4 md:p-5">
        <p className="mb-2 text-xs tracking-widest text-slate-400 uppercase">Your car type</p>
        <div className="grid grid-cols-3 gap-2">
          {CAR_TYPES.map((c) => (
            <button
              key={c.id}
              onClick={() => appStore.set({ carType: c.id })}
              className={`chip ${carType === c.id ? 'chip-on' : 'chip-off'}`}
              aria-pressed={carType === c.id}
            >
              {c.label}
            </button>
          ))}
        </div>
        <p className="mt-4 mb-2 text-xs tracking-widest text-slate-400 uppercase">Paint</p>
        <div className="flex flex-wrap items-center gap-3">
          {PAINTS.map((p) => (
            <button
              key={p.hex}
              title={p.name}
              aria-label={p.name}
              aria-pressed={paint === p.hex}
              onClick={() => appStore.set({ paint: p.hex })}
              className={`h-9 w-9 rounded-full border-2 transition ${paint === p.hex ? 'scale-110 border-neon' : 'border-white/20'}`}
              style={{ background: p.hex }}
            />
          ))}
          <span className="ml-auto text-sm text-slate-400">{PAINTS.find((p) => p.hex === paint)?.name}</span>
        </div>
      </div>
    </section>
  )
}
