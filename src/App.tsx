import { lazy, Suspense } from 'react'
import { Nav } from './components/Nav'
import { Story } from './components/Story'
import { ShowroomSection } from './components/ShowroomSection'
import { Plans } from './components/Plans'
import { Booking } from './components/Booking'
import { Addons, Faq, Footer, HowItWorks, WhyUs } from './components/Sections'
import { WhatsAppFab } from './components/WhatsAppFab'
import { Refer } from './components/Refer'

const Scene = lazy(() => import('./three/Scene'))

export default function App() {
  return (
    <>
      <div className="fixed inset-0 z-0" aria-hidden>
        <Suspense fallback={<div className="h-full w-full bg-gradient-to-b from-[#071425] to-ink" />}>
          <Scene />
        </Suspense>
        {/* vignette so text stays readable over the 3D scene */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgb(5_7_13_/_0.85)_100%)]" />
      </div>

      <Nav />
      <main className="relative z-10">
        <Story />
        <ShowroomSection />
        <WhyUs />
        <HowItWorks />
        <Plans />
        <Addons />
        <Booking />
        <Refer />
        <Faq />
      </main>
      <Footer />
      <WhatsAppFab />
    </>
  )
}
