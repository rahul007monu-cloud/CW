import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { motion } from '../store'
import { isOverCabin, topY, type Profile } from './carModel'

const COUNT = 260

/** Snow-foam bubbles that spread over the car body during the foam stage. */
export function Foam({ p }: { p: Profile }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const bubbles = useMemo(() => {
    let seed = 11
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
    return Array.from({ length: COUNT }, () => {
      const x = (rnd() * 2 - 1) * (p.halfL - 0.15)
      const top = topY(p, x)
      const onTop = rnd() < 0.45
      const half = isOverCabin(p, x) ? p.width * 0.4 + 0.04 : p.width / 2 + 0.06
      let y: number
      let z: number
      if (onTop) {
        y = top + 0.03
        z = (rnd() * 2 - 1) * half * 0.9
      } else {
        const low = Math.max(p.bottom + 0.08, p.wheelR * 2 + 0.12)
        y = low + rnd() * (Math.min(top, p.belt) - low)
        z = (rnd() < 0.5 ? -1 : 1) * (p.width / 2 + 0.05)
      }
      return {
        pos: new THREE.Vector3(x, y, z),
        size: 0.06 + rnd() * 0.12,
        // bubbles appear front-to-back so the foam "spreads"
        delay: ((x / p.halfL + 1) / 2) * 0.5 + rnd() * 0.2,
        wobble: rnd() * Math.PI * 2,
      }
    })
  }, [p])

  useEffect(() => {
    if (ref.current) ref.current.count = COUNT
  }, [])

  useFrame(({ clock }) => {
    const mesh = ref.current
    if (!mesh) return
    const f = motion.foam
    mesh.visible = f > 0.01
    if (!mesh.visible) return
    const t = clock.elapsedTime
    bubbles.forEach((b, i) => {
      const s = THREE.MathUtils.clamp((f * 1.5 - b.delay) / 0.3, 0, 1)
      const w = 1 + Math.sin(t * 3 + b.wobble) * 0.08
      dummy.position.copy(b.pos)
      dummy.position.y -= (1 - s) * 0.05
      dummy.scale.setScalar(b.size * s * w)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, COUNT]} frustumCulled={false}>
      <sphereGeometry args={[1, 12, 10]} />
      <meshPhysicalMaterial color="#ffffff" roughness={0.35} transmission={0} clearcoat={0.6} emissive="#cfe9ff" emissiveIntensity={0.25} />
    </instancedMesh>
  )
}
