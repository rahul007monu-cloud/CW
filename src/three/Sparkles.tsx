import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { motion } from '../store'

const COUNT = 90

const vertex = /* glsl */ `
  attribute float aPhase;
  attribute float aSize;
  uniform float uTime;
  uniform float uPixel;
  varying float vTw;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vTw = pow(max(0.0, sin(uTime * 2.2 + aPhase * 6.283)), 6.0);
    gl_PointSize = aSize * uPixel * (0.3 + vTw) * (10.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`
const fragment = /* glsl */ `
  uniform float uOpacity;
  varying float vTw;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    float star = max(0.0, 1.0 - abs(c.x) * 14.0) * max(0.0, 1.0 - abs(c.y) * 2.2)
               + max(0.0, 1.0 - abs(c.y) * 14.0) * max(0.0, 1.0 - abs(c.x) * 2.2);
    float a = (smoothstep(0.5, 0.0, d) * 0.6 + star) * uOpacity * (0.25 + vTw);
    gl_FragColor = vec4(vec3(0.85, 0.97, 1.0), a);
  }
`

/** Twinkling glints that appear once the car is clean. */
export function Sparkles({ halfL, height }: { halfL: number; height: number }) {
  const mat = useRef<THREE.ShaderMaterial>(null)
  const { pos, phase, size } = useMemo(() => {
    const pos = new Float32Array(COUNT * 3)
    const phase = new Float32Array(COUNT)
    const size = new Float32Array(COUNT)
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3] = (Math.random() * 2 - 1) * (halfL + 0.3)
      pos[i * 3 + 1] = 0.3 + Math.random() * (height + 0.3)
      pos[i * 3 + 2] = (Math.random() * 2 - 1) * 1.3
      phase[i] = Math.random()
      size[i] = 18 + Math.random() * 26
    }
    return { pos, phase, size }
  }, [halfL, height])

  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uOpacity: { value: 0 }, uPixel: { value: 1 } }), [])

  useFrame(({ clock, gl }) => {
    uniforms.uTime.value = clock.elapsedTime
    uniforms.uOpacity.value = motion.shine
    uniforms.uPixel.value = gl.getPixelRatio()
  })

  return (
    <points frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[pos, 3]} />
        <bufferAttribute attach="attributes-aPhase" args={[phase, 1]} />
        <bufferAttribute attach="attributes-aSize" args={[size, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={mat}
        vertexShader={vertex}
        fragmentShader={fragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
