import { HERO, STORY } from '../config'
import { useReveal } from '../lib'

function Step({ kicker, title, text, index }: { kicker: string; title: string; text: string; index: number }) {
  const ref = useReveal<HTMLDivElement>()
  return (
    <section className="flex min-h-[100svh] items-end px-5 pb-16 md:items-center md:pb-0">
      <div className="mx-auto w-full max-w-6xl">
        <div ref={ref} className="reveal panel max-w-md p-6 md:p-8">
          <p className="font-display text-sm font-semibold tracking-widest text-neon uppercase">{kicker}</p>
          <h2 className="mt-3 font-display text-3xl font-bold text-white md:text-5xl">{title}</h2>
          <p className="mt-4 text-slate-300 md:text-lg">{text}</p>
          <div className="mt-6 flex gap-2">
            {STORY.map((_, i) => (
              <span key={i} className={`h-1 rounded-full transition-all ${i === index ? 'w-10 bg-neon' : 'w-4 bg-white/20'}`} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/** Hero + wash story. Its scroll range drives the dirt → foam → rinse → shine animation. */
export function Story() {
  return (
    <div id="story">
      <section id="top" className="relative flex min-h-[100svh] items-end px-5 pb-12 md:items-center md:pb-0">
        <div className="mx-auto w-full max-w-6xl">
          <div className="max-w-xl">
            <p className="font-display text-xs font-semibold tracking-[0.25em] text-neon uppercase md:text-sm">{HERO.kicker}</p>
            <h1 className="mt-4 font-display text-4xl leading-[1.05] font-extrabold md:text-7xl">
              <span className="text-gradient">{HERO.title}</span>
            </h1>
            <p className="mt-5 max-w-md text-slate-300 md:text-lg">{HERO.text}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#plans" className="btn-primary">
                See plans
              </a>
              <a href="#book" className="btn-ghost">
                Book a wash
              </a>
            </div>
          </div>
        </div>
        <div className="pointer-events-none absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-xs tracking-widest text-slate-400 uppercase md:flex">
          <span className="flex h-9 w-6 justify-center rounded-full border border-white/30 pt-2">
            <span className="scroll-dot h-2 w-1 rounded-full bg-neon" />
          </span>
          Scroll to wash
        </div>
      </section>
      {STORY.map((s, i) => (
        <Step key={s.kicker} {...s} index={i} />
      ))}
    </div>
  )
}
