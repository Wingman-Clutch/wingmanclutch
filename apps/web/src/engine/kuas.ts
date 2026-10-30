// Kuas pensil: garis diwarnai pola butiran, jadi tekstur kertas ikut terlihat seperti pensil
// sungguhan. Butirannya menempel ke piksel kanvas (bukan ke garis), sama seperti serat kertas.

import { buatAcak } from './acak'
import type { Goresan, KodeWarna } from './goresan'

export type Tema = 'terang' | 'gelap' | 'matrix'
export type Tinta = Record<KodeWarna, string>

/** warna batang pensil di baki, sama untuk semua tema */
export const PENSIL: Tinta = {
  w: '#22252f',
  k: '#0d0f16',
  e: '#f7f6f1',
  y: '#efb21a',
  p: '#e4589c',
  b: '#2f74d0',
  g: '#2f9a52',
  o: '#ee7a24',
  r: '#d8432f',
  n: '#8b5a36',
}

/** bekas yang ditinggalkan pensil bergantung pada kertasnya; e selalu warna kertas */
export const TINTA: Record<Tema, Tinta> = {
  terang: { ...PENSIL },
  gelap: {
    w: '#eceae2',
    k: '#f6f4ec',
    e: '#161922',
    y: '#f6c33c',
    p: '#f075b0',
    b: '#5b97e6',
    g: '#4cb86c',
    o: '#f59447',
    r: '#ea6450',
    n: '#b27d55',
  },
  matrix: {
    w: '#4dff8f',
    k: '#8dffbb',
    e: '#020604',
    y: '#b9ffd2',
    p: '#86ffb6',
    b: '#3ddc7c',
    g: '#22c55e',
    o: '#9dffc2',
    r: '#5fff9a',
    n: '#2f9e5a',
  },
}

const UBIN = 96
const cacheUbin = new Map<string, HTMLCanvasElement>()

/** ubin butiran: sebagian besar terisi, dengan lubang kecil di tempat kertas tidak tersentuh */
function ubin(warna: string): HTMLCanvasElement {
  let c = cacheUbin.get(warna)
  if (c) return c
  c = document.createElement('canvas')
  c.width = c.height = UBIN
  const g = c.getContext('2d')!
  const img = g.createImageData(UBIN, UBIN)
  const acak = buatAcak(7)
  const kasar = new Float32Array(16 * 16)
  for (let i = 0; i < kasar.length; i++) kasar[i] = acak()
  const r = parseInt(warna.slice(1, 3), 16)
  const gr = parseInt(warna.slice(3, 5), 16)
  const b = parseInt(warna.slice(5, 7), 16)
  for (let y = 0; y < UBIN; y++) {
    for (let x = 0; x < UBIN; x++) {
      // nilai kasar dari grid 16x16 yang membungkus, ditambah derau per piksel
      const kx = (x / UBIN) * 16
      const ky = (y / UBIN) * 16
      const ix = Math.floor(kx)
      const iy = Math.floor(ky)
      const fx = kx - ix
      const fy = ky - iy
      const at = (i: number, j: number) => kasar[(j & 15) * 16 + (i & 15)]
      const v =
        (at(ix, iy) * (1 - fx) + at(ix + 1, iy) * fx) * (1 - fy) +
        (at(ix, iy + 1) * (1 - fx) + at(ix + 1, iy + 1) * fx) * fy
      const n = v * 0.45 + acak() * 0.75
      const alfa = Math.max(0, Math.min(1, (n - 0.2) * 1.9))
      const k = (y * UBIN + x) * 4
      img.data[k] = r
      img.data[k + 1] = gr
      img.data[k + 2] = b
      img.data[k + 3] = alfa * 255
    }
  }
  g.putImageData(img, 0, 0)
  cacheUbin.set(warna, c)
  return c
}

const cachePola = new WeakMap<CanvasRenderingContext2D, Map<string, CanvasPattern>>()
export function pola(ctx: CanvasRenderingContext2D, warna: string): CanvasPattern | string {
  let peta = cachePola.get(ctx)
  if (!peta) cachePola.set(ctx, (peta = new Map()))
  let p = peta.get(warna)
  if (!p) {
    p = ctx.createPattern(ubin(warna), 'repeat') ?? undefined
    if (!p) return warna
    peta.set(warna, p)
  }
  return p
}

/** pensil warna sedikit lebih tipis dari grafit */
const TEKANAN: Partial<Record<KodeWarna, number>> = { w: 1, k: 1, e: 1 }

export interface Kanvas {
  ctx: CanvasRenderingContext2D
  /** piksel per satuan gambar */
  skala: number
  /** pojok kiri atas kanvas dalam satuan gambar */
  x0: number
  y0: number
}

/** gambar bagian goresan dari panjang `dari` sampai `sampai` */
export function gambarRentang(k: Kanvas, g: Goresan, dari: number, sampai: number, tinta: Tinta) {
  if (sampai <= dari) return
  const { ctx, skala, x0, y0 } = k
  const t = g.titik
  const kum = g.kum
  const n = kum.length
  let i = 0
  while (i < n - 1 && kum[i + 1] <= dari) i++
  const titikPada = (s: number, j: number): [number, number] => {
    const a = kum[j]
    const b = kum[Math.min(n - 1, j + 1)]
    const u = b > a ? (s - a) / (b - a) : 0
    const x = t[j * 2] + (t[Math.min(n - 1, j + 1) * 2] - t[j * 2]) * u
    const y = t[j * 2 + 1] + (t[Math.min(n - 1, j + 1) * 2 + 1] - t[j * 2 + 1]) * u
    return [(x - x0) * skala, (y - y0) * skala]
  }
  const warna = tinta[g.warna]
  ctx.strokeStyle = g.warna === 'e' ? warna : pola(ctx, warna)
  ctx.globalAlpha = Math.min(1, g.alfa * (TEKANAN[g.warna] ?? 0.94))
  ctx.lineWidth = Math.max(0.9, g.lebar * skala)
  ctx.lineJoin = 'round'
  ctx.lineCap = dari <= 0 || sampai >= g.panjang ? 'round' : 'butt'
  ctx.beginPath()
  const awal = titikPada(dari, i)
  ctx.moveTo(awal[0], awal[1])
  let j = i + 1
  while (j < n && kum[j] < sampai) {
    ctx.lineTo((t[j * 2] - x0) * skala, (t[j * 2 + 1] - y0) * skala)
    j++
  }
  const akhir = titikPada(Math.min(sampai, g.panjang), Math.max(0, j - 1))
  ctx.lineTo(akhir[0], akhir[1])
  ctx.stroke()
}
