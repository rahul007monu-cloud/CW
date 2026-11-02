import * as THREE from 'three'
import type { CarType } from '../config'

/**
 * Side-profile measurements (in metres-ish scene units) for each car type.
 * x points forward (+x = front bumper), y up, ground at y = 0.
 */
export type Profile = {
  halfL: number
  wheelX: number
  wheelR: number
  bottom: number
  hoodY: number
  belt: number
  roof: number
  glassFront: number
  roofFront: number
  roofBack: number
  glassBack: number
  tailY: number
  width: number
}

export const PROFILES: Record<CarType, Profile> = {
  sedan: {
    halfL: 2.2, wheelX: 1.38, wheelR: 0.33, bottom: 0.26, hoodY: 0.84, belt: 0.98,
    roof: 1.42, glassFront: 0.95, roofFront: 0.18, roofBack: -0.95, glassBack: -1.72, tailY: 0.97, width: 1.78,
  },
  hatchback: {
    halfL: 1.9, wheelX: 1.22, wheelR: 0.32, bottom: 0.25, hoodY: 0.82, belt: 0.98,
    roof: 1.48, glassFront: 0.85, roofFront: 0.12, roofBack: -1.42, glassBack: -1.68, tailY: 1.0, width: 1.7,
  },
  suv: {
    halfL: 2.3, wheelX: 1.42, wheelR: 0.4, bottom: 0.4, hoodY: 1.1, belt: 1.24,
    roof: 1.84, glassFront: 1.05, roofFront: 0.32, roofBack: -1.9, glassBack: -2.06, tailY: 1.22, width: 1.9,
  },
}

const BEVEL = { thickness: 0.1, size: 0.06 }

function extrude(shape: THREE.Shape, width: number, bevel = BEVEL, segments = 5) {
  const depth = Math.max(width - bevel.thickness * 2, 0.01)
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel.thickness,
    bevelSize: bevel.size,
    bevelSegments: segments,
    curveSegments: 28,
  })
  geo.translate(0, 0, -depth / 2)
  geo.computeVertexNormals()
  return geo
}

export function bodyGeometry(p: Profile) {
  const s = new THREE.Shape()
  const L = p.halfL
  const arch = p.wheelR + 0.1
  s.moveTo(-L + 0.1, p.bottom)
  for (const cx of [-p.wheelX, p.wheelX]) {
    s.lineTo(cx - arch, p.bottom)
    s.lineTo(cx - arch, p.wheelR)
    s.absarc(cx, p.wheelR, arch, Math.PI, 0, true)
    s.lineTo(cx + arch, p.bottom)
  }
  s.lineTo(L - 0.15, p.bottom)
  s.quadraticCurveTo(L + 0.04, p.bottom, L + 0.04, p.bottom + 0.22)
  s.lineTo(L, p.hoodY - 0.1)
  s.quadraticCurveTo(L - 0.02, p.hoodY, L - 0.35, p.hoodY + 0.03)
  s.lineTo(p.glassFront, p.belt)
  s.lineTo(p.glassBack, p.belt)
  s.lineTo(-L + 0.15, p.tailY)
  s.quadraticCurveTo(-L - 0.03, p.tailY - 0.02, -L - 0.03, p.tailY - 0.25)
  s.lineTo(-L - 0.02, p.bottom + 0.18)
  s.quadraticCurveTo(-L, p.bottom, -L + 0.1, p.bottom)
  return extrude(s, p.width)
}

export function glassGeometry(p: Profile) {
  const s = new THREE.Shape()
  s.moveTo(p.glassFront, p.belt - 0.04)
  s.lineTo(p.roofFront, p.roof)
  s.lineTo(p.roofBack, p.roof)
  s.lineTo(p.glassBack, p.belt - 0.04)
  s.closePath()
  return extrude(s, p.width * 0.8, { thickness: 0.06, size: 0.04 }, 3)
}

export function roofGeometry(p: Profile) {
  const s = new THREE.Shape()
  s.moveTo(p.roofFront + 0.06, p.roof - 0.03)
  s.lineTo(p.roofFront - 0.04, p.roof + 0.04)
  s.lineTo(p.roofBack + 0.04, p.roof + 0.04)
  s.lineTo(p.roofBack - 0.06, p.roof - 0.03)
  s.closePath()
  return extrude(s, p.width * 0.84, { thickness: 0.05, size: 0.03 }, 3)
}

/** Approximate top surface height at a given x (used to place foam). */
export function topY(p: Profile, x: number) {
  const pts: [number, number][] = [
    [-p.halfL, p.tailY - 0.05],
    [p.glassBack, p.belt],
    [p.roofBack, p.roof],
    [p.roofFront, p.roof],
    [p.glassFront, p.belt],
    [p.halfL - 0.35, p.hoodY + 0.03],
    [p.halfL, p.hoodY - 0.1],
  ]
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i]
    const [x1, y1] = pts[i + 1]
    if (x >= x0 && x <= x1) return y0 + ((x - x0) / (x1 - x0 || 1)) * (y1 - y0)
  }
  return p.belt
}

export function isOverCabin(p: Profile, x: number) {
  return x > p.glassBack && x < p.glassFront
}
