import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { CarType } from '../config'
import { motion } from '../store'
import { PROFILES, bodyGeometry, glassGeometry, roofGeometry, type Profile } from './carModel'
import { makeDirtTexture } from './textures'
import { Foam } from './Foam'

const DIRT_TINT = new THREE.Color('#6d5b45')

function Wheel({ p, x, side, spinRef }: { p: Profile; x: number; side: 1 | -1; spinRef: (g: THREE.Group | null) => void }) {
  const r = p.wheelR
  const z = side * (p.width / 2 - 0.12)
  return (
    <group position={[x, r, z]}>
      <group ref={spinRef}>
        <mesh rotation-x={Math.PI / 2} castShadow>
          <cylinderGeometry args={[r, r, 0.26, 40]} />
          <meshStandardMaterial color="#0b0b0d" roughness={0.85} />
        </mesh>
        <mesh rotation-x={Math.PI / 2} position-z={side * 0.135}>
          <cylinderGeometry args={[r * 0.66, r * 0.66, 0.02, 40]} />
          <meshStandardMaterial color="#1a1d22" metalness={0.9} roughness={0.35} />
        </mesh>
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={i} position-z={side * 0.15} rotation-z={(i / 5) * Math.PI * 2}>
            <boxGeometry args={[r * 1.18, 0.06, 0.03]} />
            <meshStandardMaterial color="#c9ced6" metalness={1} roughness={0.18} />
          </mesh>
        ))}
        <mesh rotation-x={Math.PI / 2} position-z={side * 0.16}>
          <cylinderGeometry args={[r * 0.14, r * 0.14, 0.03, 20]} />
          <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={1.5} />
        </mesh>
      </group>
    </group>
  )
}

export function Car({ type, paint }: { type: CarType; paint: string }) {
  const p = PROFILES[type]
  const geo = useMemo(() => ({ body: bodyGeometry(p), glass: glassGeometry(p), roof: roofGeometry(p) }), [p])
  useEffect(() => () => Object.values(geo).forEach((g) => g.dispose()), [geo])

  const dirtTex = useMemo(() => {
    const t = makeDirtTexture()
    t.repeat.set(1 / 4.8, 1 / 2.1)
    t.offset.set(0.5, 0)
    return t
  }, [])

  const paintMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: paint,
        metalness: 0.55,
        roughness: 0.3,
        clearcoat: 1,
        clearcoatRoughness: 0.04,
        envMapIntensity: 1.4,
      }),
    [], // colour is animated in useFrame, so the material is created once
  )
  const dirtMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: dirtTex,
        transparent: true,
        depthWrite: false,
        roughness: 1,
        polygonOffset: true,
        polygonOffsetFactor: -2,
      }),
    [dirtTex],
  )
  const glassMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#0a111c',
        metalness: 0.7,
        roughness: 0.05,
        clearcoat: 1,
        envMapIntensity: 2,
      }),
    [],
  )

  const target = useMemo(() => new THREE.Color(paint), [paint])
  const current = useRef(new THREE.Color(paint))
  const wheels = useRef<(THREE.Group | null)[]>([])
  const bounce = useRef<THREE.Group>(null)
  const swapAt = useRef(-10)
  const firstType = useRef(true)

  useEffect(() => {
    if (firstType.current) {
      firstType.current = false
      return
    }
    swapAt.current = performance.now() / 1000
  }, [type])

  useFrame((_, dt) => {
    const { dirt, water, shine } = motion
    current.current.lerp(target, Math.min(1, dt * 5))
    paintMat.color.copy(current.current).lerp(DIRT_TINT, dirt * 0.55)
    paintMat.roughness = 0.22 + dirt * 0.68 - water * 0.05
    paintMat.clearcoat = 1 - dirt * 0.9
    paintMat.metalness = 0.3 - dirt * 0.15
    paintMat.envMapIntensity = 0.6 + (1 - dirt) * 1.2 + shine * 1.2
    dirtMat.opacity = dirt
    glassMat.roughness = 0.05 + dirt * 0.45

    const spin = -motion.page * 70
    for (const w of wheels.current) if (w) w.rotation.z = spin

    if (bounce.current) {
      const e = performance.now() / 1000 - swapAt.current
      const k = e < 1.2 ? Math.sin(e * 14) * 0.09 * Math.exp(-e * 5) : 0
      bounce.current.scale.set(1 - k * 0.5, 1 + k, 1 - k * 0.5)
    }
  })

  const lightY = p.hoodY - 0.12
  return (
    <group ref={bounce}>
      <mesh geometry={geo.body} material={paintMat} castShadow />
      <mesh geometry={geo.body} material={dirtMat} scale={1.002} renderOrder={1} />
      <mesh geometry={geo.glass} material={glassMat} />
      <mesh geometry={geo.roof} material={paintMat} />

      {/* B-pillars */}
      <mesh position={[(p.roofFront + p.roofBack) / 2 + 0.1, (p.belt + p.roof) / 2, 0]} material={paintMat}>
        <boxGeometry args={[0.09, p.roof - p.belt, p.width * 0.82]} />
      </mesh>

      {/* mirrors */}
      {[1, -1].map((s) => (
        <mesh key={s} position={[p.glassFront - 0.12, p.belt + 0.06, s * (p.width / 2 + 0.04)]} material={paintMat}>
          <boxGeometry args={[0.16, 0.1, 0.12]} />
        </mesh>
      ))}

      {/* headlights + cyan DRL strip */}
      {[1, -1].map((s) => (
        <group key={s}>
          <mesh position={[p.halfL + 0.06, lightY, s * p.width * 0.33]}>
            <boxGeometry args={[0.06, 0.11, 0.42]} />
            <meshStandardMaterial color="#f2fdff" emissive="#dff8ff" emissiveIntensity={5} toneMapped={false} />
          </mesh>
          <mesh position={[p.halfL + 0.065, lightY - 0.1, s * p.width * 0.33]}>
            <boxGeometry args={[0.05, 0.025, 0.42]} />
            <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={4} toneMapped={false} />
          </mesh>
        </group>
      ))}
      {/* grille */}
      <mesh position={[p.halfL + 0.08, p.bottom + 0.22, 0]}>
        <boxGeometry args={[0.05, 0.16, p.width * 0.48]} />
        <meshStandardMaterial color="#07080a" metalness={0.8} roughness={0.4} />
      </mesh>
      {/* full-width tail light bar */}
      <mesh position={[-p.halfL - 0.09, p.tailY - 0.14, 0]}>
        <boxGeometry args={[0.05, 0.07, p.width * 0.9]} />
        <meshStandardMaterial color="#ff2a3d" emissive="#ff1f35" emissiveIntensity={4} toneMapped={false} />
      </mesh>
      {/* chrome window line + dark side skirts */}
      {[1, -1].map((s) => (
        <group key={`trim${s}`}>
          <mesh position={[(p.glassFront + p.glassBack) / 2, p.belt - 0.01, s * (p.width / 2 + 0.005)]}>
            <boxGeometry args={[p.glassFront - p.glassBack, 0.025, 0.02]} />
            <meshStandardMaterial color="#e5e9ef" metalness={1} roughness={0.12} />
          </mesh>
          <mesh position={[0, p.bottom + 0.06, s * (p.width / 2 + 0.01)]}>
            <boxGeometry args={[p.wheelX * 2 - p.wheelR * 2 - 0.3, 0.1, 0.03]} />
            <meshStandardMaterial color="#0a0b0e" roughness={0.6} />
          </mesh>
        </group>
      ))}

      {[-p.wheelX, p.wheelX].flatMap((x, i) =>
        ([1, -1] as const).map((s, j) => (
          <Wheel key={`${i}${j}`} p={p} x={x} side={s} spinRef={(g) => (wheels.current[i * 2 + j] = g)} />
        )),
      )}

      <Foam p={p} />
    </group>
  )
}
