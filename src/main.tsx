import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import { hideSplash } from './lib'
import './index.css'

registerSW({ immediate: true })

// Safety net: never keep the splash longer than 6 s (slow phone / no WebGL).
setTimeout(hideSplash, 6000)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
