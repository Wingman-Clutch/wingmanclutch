// Tempat figur Colorfigures di sketsa halaman. Sumber figurnya di figur/, gambar diam dan ukurannya
// dibuat scripts/buat-figur.mjs.

import UKURAN from '../data/figur.json'
import { G, type Op } from '../engine/goresan'
import { kotak } from '../engine/jalur'
import type { Figur } from '../engine/sketsa'

interface Kotak {
  x: number
  y: number
  w: number
  h: number
}

/** kotak figur aplikasi di atas label nama (satuan gambar) */
export const KOTAK_APLIKASI: Kotak = { x: -8, y: -22, w: 216, h: 216 }
/** kotak figur tim di atas judul Tim kami */
export const KOTAK_TIM: Kotak = { x: 28, y: -22, w: 144, h: 136 }
/** kotak mug di sebelah kiri tulisan kopi hari ini */
export const KOTAK_KOPI: Kotak = { x: -6, y: 16, w: 72, h: 74 }

/** figur sebesar mungkin di dalam kotak: di tengah, menempel ke bawah kotak */
export function letakFigur(id: keyof typeof UKURAN, k: Kotak): Figur {
  const { w, h } = UKURAN[id]
  const s = Math.min(k.w / w, k.h / h)
  return {
    src: `/figur/${id}.webp`,
    x: k.x + (k.w - w * s) / 2,
    y: k.y + k.h - h * s,
    w: w * s,
    h: h * s,
  }
}

/** bingkai tak terlihat supaya kanvas sketsa ikut mencakup figurnya */
export const bingkai = (f: Figur): Op =>
  G(kotak(f.x, f.y, f.w, f.h), 'e', 0.5, { lintasan: 1, amp: 0, lebih: 0, a: 0 })
