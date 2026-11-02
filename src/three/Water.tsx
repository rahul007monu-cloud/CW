import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { motion } from '../store'
import { makeDotTexture } from './textures'

const COUNT = 900

/** Two sweeping high-pressure jets that rinse the car. */
export function Water({ halfL }: { halfL: number }) {
  const points = useRef<THREE.Points>(null)
  const mat = useRef<THREE.PointsMaterial>(null)
  const tex = useMemo(() => makeDotTexture(), [])

  const { positions, seeds } = useMemo(() => {
    const seeds = Array.from({ length: COUNT }, (_, i) => ({
      phase: Math.random(),
      side: i % 2 === 0 ? 1 : -1,
      sx: (Math.random() - 0.5) * 0.5,
      sz: (Math.random() - 0.5) * 0.5,
      speed: 0.8 + Math.random() * 0.5,
    }))
    return { positions: new Float32Array(COUNT * 3), seeds }
  }, [])

  useFrame(({ clock }) => {
    const pts = points.current
    if (!pts || !mat.current) return
    const w = motion.water
    pts.visible = w > 0.01
    if (!pts.visible) return
    mat.current.opacity = w * 0.9
    const t = clock.elapsedTime
    for (let i = 0; i < COUNT; i++) {
      const s = seeds[i]
      const life = (t * s.speed * 1.4 + s.phase) % 1
      const sweep = Math.sin(t * 0.9 + s.side) * halfL * 0.85
      // nozzle above & beside the car, aiming down at the body
      const ox = sweep
      const oy = 3.1
      const oz = s.side * 1.9
      const tx = sweep + s.sx * 1.4
      const ty = 0.7
      const tz = s.side * 0.45 + s.sz
      const k = life * 1.15
      positions[i * 3] = ox + (tx - ox) * k
      positions[i * 3 + 1] = oy + (ty - oy) * k - life * life * 0.4
      positions[i * 3 + 2] = oz + (tz - oz) * k
    }
    pts.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={points} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={mat}
        map={tex}
        color="#8be3ff"
        size={0.07}
        sizeAttenuation
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
