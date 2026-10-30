// Logo Wingman Clutch sebagai bentuk berisi (bukan sketsa pensil), untuk cetakan di kartu nama dan
// tali lanyard. Bentuknya dari garis tepi di data/logo.json; posisi dan skala dihitung dari kotak
// setiap bagian, jadi tetap pas kalau logo.json dibuat ulang dengan scripts/buat-logo.mjs.

import data from '../data/logo.json'
import { uraiPath, type Garis } from '../engine/jalur'

export interface Bentuk {
  d: string
  garis: Garis[]
  x: number
  y: number
  w: number
  h: number
}

function bentuk(d: string): Bentuk {
  const garis = uraiPath(d)
  const titik = garis.flat()
  const xs = titik.map((t) => t[0])
  const ys = titik.map((t) => t[1])
  const x = Math.min(...xs)
  const y = Math.min(...ys)
  return { d, garis, x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y }
}

const LAMBANG = bentuk(data.lambang)
const WINGMAN = bentuk(data.wingman)
const CLUTCH = bentuk(data.clutch)

/** lebar dibagi tinggi lambang */
export const RASIO_LAMBANG = LAMBANG.w / LAMBANG.h

export interface Letak {
  b: Bentuk
  x: number
  y: number
  s: number
}

/**
 * Logo mendatar seperti docs/brand/wingman-clutch-horizontal.svg: lambang di kiri, WINGMAN dan
 * CLUTCH bertumpuk di kanannya, tegak di tengah lambang. Satuan: tinggi lambang.
 */
export function letakMendatar(): { letak: Letak[]; w: number; h: number } {
  const h = LAMBANG.h
  const sW = (0.225 * h) / WINGMAN.h
  const sC = (0.125 * h) / CLUTCH.h
  const xTeks = LAMBANG.w + 0.15 * h
  const lebarTeks = WINGMAN.w * sW
  const jedaBaris = 0.075 * h
  const yW = (h - (WINGMAN.h * sW + jedaBaris + CLUTCH.h * sC)) / 2
  return {
    letak: [
      { b: LAMBANG, x: 0, y: 0, s: 1 },
      { b: WINGMAN, x: xTeks, y: yW, s: sW },
      {
        b: CLUTCH,
        x: xTeks + (lebarTeks - CLUTCH.w * sC) / 2,
        y: yW + WINGMAN.h * sW + jedaBaris,
        s: sC,
      },
    ],
    w: xTeks + lebarTeks,
    h,
  }
}

/** svg logo berwarna currentColor: lambang saja, atau mendatar dengan WINGMAN CLUTCH */
export function svgLogo(susun: 'lambang' | 'mendatar') {
  const ns = 'http://www.w3.org/2000/svg'
  const { letak, w, h } =
    susun === 'mendatar'
      ? letakMendatar()
      : { letak: [{ b: LAMBANG, x: 0, y: 0, s: 1 }], w: LAMBANG.w, h: LAMBANG.h }
  const svg = document.createElementNS(ns, 'svg')
  svg.setAttribute('viewBox', `0 0 ${w.toFixed(1)} ${h.toFixed(1)}`)
  svg.setAttribute('aria-hidden', 'true')
  svg.setAttribute('class', `logo-${susun}`)
  for (const { b, x, y, s } of letak) {
    const p = document.createElementNS(ns, 'path')
    p.setAttribute('d', b.d)
    p.setAttribute('fill-rule', 'evenodd')
    p.setAttribute(
      'transform',
      `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${s.toFixed(4)}) translate(${-b.x} ${-b.y})`,
    )
    svg.append(p)
  }
  return svg
}

/** isi lambang di kanvas dengan warna isian aktif; (x, y) = pojok kiri atas, `tinggi` dalam px */
export function isiLambang(ctx: CanvasRenderingContext2D, x: number, y: number, tinggi: number) {
  const s = tinggi / LAMBANG.h
  ctx.beginPath()
  for (const g of LAMBANG.garis) {
    g.forEach(([gx, gy], i) => {
      const px = x + (gx - LAMBANG.x) * s
      const py = y + (gy - LAMBANG.y) * s
      if (i) ctx.lineTo(px, py)
      else ctx.moveTo(px, py)
    })
    ctx.closePath()
  }
  ctx.fill('evenodd')
}
