import { useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer, MeshReflectorMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { motion, useApp } from '../store'
import { Car } from './Car'
import { Water } from './Water'
import { Sparkles } from './Sparkles'
import { PROFILES } from './carModel'
import { makeRadialTexture } from './textures'
import { hideSplash } from '../lib'

const { clamp, damp, smoothstep, lerp } = THREE.MathUtils

function rectProgress(id: string) {
  const el = document.getElementById(id)
  if (!el) return null
  return el.getBoundingClientRect()
}

/** Reads the page scroll once per frame and turns it into animation values. */
function ScrollDriver() {
  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.1)
    const vh = window.innerHeight
    const max = document.documentElement.scrollHeight - vh
    const page = max > 0 ? window.scrollY / max : 0

    const story = rectProgress('story')
    const storyP = story ? clamp(-story.top / Math.max(story.height - vh, 1), 0, 1) : 0

    const show = rectProgress('showroom')
    let focus = 0
    if (show) {
      const d = Math.abs(show.top + show.height / 2 - vh / 2) / vh
      focus = clamp(1 - d * 1.8, 0, 1)
    }

    motion.page = damp(motion.page, page, 5, dt)
    motion.story = damp(motion.story, storyP, 5, dt)
    motion.focus = damp(motion.focus, focus, 4, dt)

    const s = motion.story
    motion.foam = smoothstep(s, 0.1, 0.3) * (1 - smoothstep(s, 0.5, 0.64))
    motion.water = smoothstep(s, 0.44, 0.56) * (1 - smoothstep(s, 0.8, 0.9))
    motion.dirt = 1 - smoothstep(s, 0.5, 0.76)
    motion.shine = smoothstep(s, 0.78, 0.98)
  })
  return null
}

function CameraRig() {
  const { camera, size } = useThree()
  const look = useMemo(() => new THREE.Vector3(), [])
  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.1)
    const cam = camera as THREE.PerspectiveCamera
    const portrait = size.width / size.height < 0.9
    const fov = portrait ? 44 : 32
    if (Math.abs(cam.fov - fov) > 0.01) {
      cam.fov = fov
      cam.updateProjectionMatrix()
    }
    const f = motion.focus
    const tz = portrait ? lerp(9, 8, f) : lerp(12, 9.5, f)
    const ty = lerp(2.6, 1.8, f) + motion.water * 0.4
    cam.position.x = damp(cam.position.x, 0, 3, dt)
    cam.position.y = damp(cam.position.y, ty, 3, dt)
    cam.position.z = damp(cam.position.z, tz, 3, dt)
    look.set(0, portrait ? 0.95 : 0.75, 0)
    cam.lookAt(look)
  })
  return null
}

function Stage() {
  const { carType, paint } = useApp()
  const { size } = useThree()
  const p = PROFILES[carType]
  const stage = useRef<THREE.Group>(null)
  const spinner = useRef<THREE.Group>(null)
  const idle = useRef(0)
  const shadowTex = useMemo(() => makeRadialTexture('rgba(0,0,0,0.85)', 'rgba(0,0,0,0)'), [])
  const glowTex = useMemo(() => makeRadialTexture('rgba(34,211,238,0.9)', 'rgba(34,211,238,0)'), [])
  const ringMat = useRef<THREE.MeshStandardMaterial>(null)

  useFrame(({ clock }, rawDt) => {
    const dt = Math.min(rawDt, 0.1)
    const g = stage.current
    const sp = spinner.current
    if (!g || !sp) return
    const aspect = size.width / size.height
    const wide = aspect > 1.1
    const portrait = aspect < 0.9
    const f = motion.focus

    const tx = wide ? lerp(2.1, 0, f) : 0
    const ty = portrait ? lerp(1.35, 0.35, f) : 0
    const sc = portrait ? clamp(aspect * 1.3, 0.55, 1) : 1
    g.position.x = damp(g.position.x, tx, 3, dt)
    g.position.y = damp(g.position.y, ty, 3, dt)
    g.scale.setScalar(damp(g.scale.x, sc, 3, dt))

    // Rotation is tied to scroll: two full turns from top to bottom of the page.
    // In the showroom the car also keeps turning slowly on its own.
    idle.current += dt * 0.35 * f
    sp.rotation.y = -0.65 + motion.page * Math.PI * 4 + idle.current + Math.sin(clock.elapsedTime * 0.4) * 0.03

    if (ringMat.current) ringMat.current.emissiveIntensity = 1.5 + motion.shine * 2.5 + Math.sin(clock.elapsedTime * 2) * 0.3
  })

  return (
    <group ref={stage}>
      <group ref={spinner}>
        {/* turntable */}
        <mesh position-y={0.03} receiveShadow>
          <cylinderGeometry args={[2.85, 2.9, 0.06, 96]} />
          <meshStandardMaterial color="#0b0e15" metalness={0.85} roughness={0.35} />
        </mesh>
        <mesh position-y={0.062} rotation-x={-Math.PI / 2}>
          <ringGeometry args={[2.78, 2.83, 128]} />
          <meshStandardMaterial ref={ringMat} color="#22d3ee" emissive="#22d3ee" emissiveIntensity={2} toneMapped={false} />
        </mesh>
        <mesh position-y={0.063} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[p.halfL * 3.2, p.width * 2.6]} />
          <meshBasicMaterial map={glowTex} transparent depthWrite={false} blending={THREE.AdditiveBlending} opacity={0.55} />
        </mesh>
        <mesh position-y={0.064} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[p.halfL * 2.5, p.width * 1.7]} />
          <meshBasicMaterial map={shadowTex} transparent depthWrite={false} />
        </mesh>

        <group position-y={0.06}>
          <Car type={carType} paint={paint} />
        </group>
      </group>

      <Water halfL={p.halfL} />
      <Sparkles halfL={p.halfL} height={p.roof} />
    </group>
  )
}

function Floor({ reflective }: { reflective: boolean }) {
  return (
    <mesh rotation-x={-Math.PI / 2} position-y={0}>
      <planeGeometry args={[60, 60]} />
      {reflective ? (
        <MeshReflectorMaterial
          blur={[300, 80]}
          resolution={512}
          mixBlur={1}
          mixStrength={18}
          roughness={1}
          depthScale={1.1}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#06080d"
          metalness={0.6}
          mirror={0}
        />
      ) : (
        <meshStandardMaterial color="#070910" roughness={0.55} metalness={0.4} />
      )}
    </mesh>
  )
}

function Showroom() {
  return (
    <Environment resolution={256} frames={1}>
      <Lightformer form="rect" intensity={3} position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[12, 1.2, 1]} />
      <Lightformer form="rect" intensity={2} position={[0, 6, -3]} rotation-x={Math.PI / 2} scale={[12, 0.6, 1]} />
      <Lightformer form="rect" intensity={2} position={[0, 6, 3]} rotation-x={Math.PI / 2} scale={[12, 0.6, 1]} />
      <Lightformer form="rect" intensity={2.5} position={[-7, 2, 0]} rotation-y={Math.PI / 2} scale={[14, 1.4, 1]} />
      <Lightformer form="rect" intensity={2.5} position={[7, 2, 0]} rotation-y={-Math.PI / 2} scale={[14, 1.4, 1]} />
      <Lightformer form="ring" color="#22d3ee" intensity={5} scale={3} position={[-5, 4, 6]} target={[0, 0, 0]} />
      <Lightformer form="ring" color="#3b82f6" intensity={4} scale={3} position={[6, 3, -6]} target={[0, 0, 0]} />
    </Environment>
  )
}

export default function Scene() {
  const isSmall = typeof window !== 'undefined' && Math.min(window.innerWidth, window.innerHeight) < 700
  return (
    <Canvas
      className="!fixed inset-0"
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }}
      dpr={[1, isSmall ? 1.5 : 2]}
      camera={{ position: [0, 2.1, 9], fov: 32, near: 0.1, far: 80 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      onCreated={() => requestAnimationFrame(() => requestAnimationFrame(hideSplash))}
      fallback={<div className="fixed inset-0 bg-gradient-to-b from-[#071425] to-ink" />}
    >
      <color attach="background" args={['#05070d']} />
      <fog attach="fog" args={['#05070d', 11, 28]} />
      <ScrollDriver />
      <CameraRig />
      <ambientLight intensity={0.25} />
      <directionalLight position={[4, 8, 5]} intensity={1.4} />
      <spotLight position={[0, 9, 0]} angle={0.55} penumbra={1} intensity={60} color="#e6f6ff" />
      <pointLight position={[-5, 1.5, -3]} intensity={25} color="#22d3ee" />
      <pointLight position={[5, 1.5, 3]} intensity={12} color="#3b82f6" />
      <Showroom />
      <Stage />
      <Floor reflective={!isSmall} />
    </Canvas>
  )
}
