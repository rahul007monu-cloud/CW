import { useEffect, useState } from 'react'

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true

const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent)

/** "Install app" button: native prompt on Android/desktop, a short guide on iPhone. */
export function InstallApp() {
  const [evt, setEvt] = useState<BIPEvent | null>(null)
  const [iosHelp, setIosHelp] = useState(false)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    setInstalled(isStandalone())
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setEvt(e as BIPEvent)
    }
    const onInstalled = () => setInstalled(true)
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (installed || (!evt && !isIOS())) return null

  return (
    <>
      <button
        className="btn-ghost !px-4 !py-2 text-sm whitespace-nowrap"
        onClick={async () => {
          if (evt) {
            await evt.prompt()
            setEvt(null)
          } else setIosHelp(true)
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" />
        </svg>
        App
      </button>
      {iosHelp && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4" onClick={() => setIosHelp(false)}>
          <div className="panel w-full max-w-sm p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-xl font-bold text-white">Install on iPhone</h3>
            <ol className="mt-4 space-y-2 text-left text-slate-300">
              <li>1. Tap the <b>Share</b> button in Safari.</li>
              <li>2. Choose <b>Add to Home Screen</b>.</li>
              <li>3. Tap <b>Add</b>. The app icon appears on your home screen.</li>
            </ol>
            <button className="btn-primary mt-6 w-full" onClick={() => setIosHelp(false)}>
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  )
}
