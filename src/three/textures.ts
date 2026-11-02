import * as THREE from 'three'

function canvas(size: number) {
  const c = document.createElement('canvas')
  c.width = c.height = size
  return [c, c.getContext('2d')!] as const
}

/** Soft round dot used by water drops. */
export function makeDotTexture() {
  const [c, g] = canvas(64)
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32)
  grad.addColorStop(0, 'rgba(255,255,255,1)')
  grad.addColorStop(0.35, 'rgba(255,255,255,0.8)')
  grad.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, 64, 64)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

/** Radial gradient: used for the blob shadow and the neon under-glow. */
export function makeRadialTexture(inner: string, outer: string) {
  const [c, g] = canvas(256)
  const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128)
  grad.addColorStop(0, inner)
  grad.addColorStop(1, outer)
  g.fillStyle = grad
  g.fillRect(0, 0, 256, 256)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

/**
 * Procedural dust / mud splatter. Heavier towards the bottom of the
 * texture, which maps to the lower part of the car body.
 */
export function makeDirtTexture() {
  const size = 512
  const [c, g] = canvas(size)
  let seed = 7
  const rnd = () => {
    seed = (seed * 16807) % 2147483647
    return seed / 2147483647
  }
  // overall film of dust
  const film = g.createLinearGradient(0, 0, 0, size)
  film.addColorStop(0, 'rgba(130, 108, 78, 0.35)')
  film.addColorStop(1, 'rgba(105, 84, 58, 0.7)')
  g.fillStyle = film
  g.fillRect(0, 0, size, size)
  for (let i = 0; i < 2600; i++) {
    const y = Math.pow(rnd(), 0.6) * size // bias towards bottom (canvas y down = car bottom)
    const x = rnd() * size
    const r = 1 + rnd() * (y > size * 0.65 ? 7 : 3)
    const a = 0.04 + rnd() * (y > size * 0.65 ? 0.2 : 0.08)
    const tone = 70 + rnd() * 50
    g.fillStyle = `rgba(${tone + 30}, ${tone + 10}, ${tone - 15}, ${a})`
    g.beginPath()
    g.ellipse(x, y, r, r * (0.4 + rnd() * 0.8), rnd() * Math.PI, 0, Math.PI * 2)
    g.fill()
  }
  // a few streaks running down
  for (let i = 0; i < 80; i++) {
    const x = rnd() * size
    const y = rnd() * size * 0.7
    g.strokeStyle = `rgba(90, 72, 50, ${0.08 + rnd() * 0.12})`
    g.lineWidth = 1 + rnd() * 3
    g.beginPath()
    g.moveTo(x, y)
    g.lineTo(x + (rnd() - 0.5) * 8, y + 20 + rnd() * 60)
    g.stroke()
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  return t
}
