// Tulisan di halaman: tulisan tangan satu goresan (EMS Tech) dan judul tebal berarsir (Bungee).
// Data glyph dibuat oleh scripts/buat-font.mjs.

import font from '../data/font.json'
import { A, G, grup, type KodeWarna, type Op } from './goresan'
import { geser, uraiPath, type Garis } from './jalur'

type DataGlyph = Record<string, [number, string]>
const TANGAN = font.tangan as unknown as DataGlyph
const JUDUL = font.judul as unknown as DataGlyph

/** tinggi huruf kapital dalam satuan font */
const KAPITAL_TANGAN = 670
const KAPITAL_JUDUL = 720

const cache = new Map<string, Garis[]>()
function glyph(sumber: DataGlyph, nama: string, k: string): [number, Garis[]] {
  const data = sumber[k] ?? sumber['?']
  const kunci = nama + k
  let g = cache.get(kunci)
  if (!g) {
    g = data[1] ? uraiPath(data[1]) : []
    cache.set(kunci, g)
  }
  return [data[0], g]
}

export type Rata = 'l' | 'c' | 'r'

export interface OpsiTulis {
  rata?: Rata
  /** pengali jarak antarhuruf */
  jarak?: number
  w?: number
  a?: number
}

/** tepi kiri dan kanan tinta glyph tangan dalam satuan font; null untuk glyph tanpa tinta (spasi) */
const tepi = new Map<string, [number, number] | null>()
function tepiTinta(k: string) {
  if (!tepi.has(k)) {
    let a = Infinity
    let b = -Infinity
    for (const p of glyph(TANGAN, 't', k)[1])
      for (const [x] of p) {
        a = Math.min(a, x)
        b = Math.max(b, x)
      }
    tepi.set(k, a <= b ? [a, b] : null)
  }
  return tepi.get(k)!
}

/** glyph yang tintanya lebih sempit dari ini (I, titik dua, tanda seru) diberi celah minimal */
const SEMPIT = 150
/** celah tinta minimal di samping glyph sempit, dalam satuan font */
const CELAH_SEMPIT = 170

/**
 * Posisi pena setiap huruf dan lebar total, dalam satuan font. Jarak huruf mengikuti lebar maju
 * glyph dikali `jarak`, kecuali di samping glyph sempit: "I" hanya satu garis tegak, jadi tanpa
 * celah minimal "WIN" terbaca "WN".
 */
function susun(teks: string, jarak: number) {
  const x: number[] = []
  let pena = 0
  /** tepi kanan tinta huruf sebelumnya, null setelah spasi */
  let kanan: number | null = null
  let sempit = false
  for (const k of teks) {
    const t = tepiTinta(k)
    if (t && kanan !== null && (sempit || t[1] - t[0] < SEMPIT)) {
      const celah = pena + t[0] - kanan
      if (celah < CELAH_SEMPIT * jarak) pena += CELAH_SEMPIT * jarak - celah
    }
    x.push(pena)
    kanan = t ? pena + t[1] : null
    sempit = t ? t[1] - t[0] < SEMPIT : false
    pena += glyph(TANGAN, 't', k)[0] * jarak
  }
  return { x, lebar: pena }
}

export function lebarTulisan(teks: string, ukuran: number, jarak = 1.08) {
  return susun(teks, jarak).lebar * (ukuran / KAPITAL_TANGAN)
}

/** celah tinta antara huruf yang bersebelahan (tidak melewati spasi), dalam satuan gambar */
export function celahTinta(teks: string, ukuran: number, jarak = 1.08) {
  const { x } = susun(teks, jarak)
  const huruf = [...teks]
  const celah: number[] = []
  for (let i = 1; i < huruf.length; i++) {
    const a = tepiTinta(huruf[i - 1])
    const b = tepiTinta(huruf[i])
    if (a && b) celah.push((x[i] + b[0] - (x[i - 1] + a[1])) * (ukuran / KAPITAL_TANGAN))
  }
  return celah
}

/** tulisan tangan dengan garis dasar di y; ukuran = tinggi huruf kapital */
export function tulis(
  teks: string,
  x: number,
  y: number,
  ukuran: number,
  c: KodeWarna = 'w',
  o: OpsiTulis = {},
): Op {
  const s = ukuran / KAPITAL_TANGAN
  const { x: pena, lebar } = susun(teks, o.jarak ?? 1.08)
  const x0 = o.rata === 'c' ? x - (lebar * s) / 2 : o.rata === 'r' ? x - lebar * s : x
  const garis: Garis[] = []
  ;[...teks].forEach((k, i) => {
    const kx = x0 + pena[i] * s
    for (const p of glyph(TANGAN, 't', k)[1])
      garis.push(p.map(([gx, gy]) => [kx + gx * s, y + gy * s]))
  })
  return G(garis, c, o.w ?? Math.max(1.8, ukuran * 0.15), {
    lintasan: 1,
    amp: ukuran * 0.012,
    lebih: 0.3,
    a: o.a,
  })
}

export function lebarJudul(teks: string, ukuran: number) {
  const s = ukuran / KAPITAL_JUDUL
  let l = 0
  for (const k of teks.toUpperCase()) l += glyph(JUDUL, 'j', k)[0] * s
  return l
}

export interface OpsiJudul {
  rata?: Rata
  /** warna bayangan geser di bawah huruf, null tanpa bayangan */
  bayang?: KodeWarna | null
  /** warna isi huruf */
  isi?: KodeWarna
}

/** judul tebal: garis tepi, arsiran rapat, dan bayangan warna yang sedikit bergeser */
export function judul(teks: string, x: number, y: number, ukuran: number, o: OpsiJudul = {}): Op[] {
  const s = ukuran / KAPITAL_JUDUL
  const lebar = lebarJudul(teks, ukuran)
  let kx = o.rata === 'c' ? x - lebar / 2 : o.rata === 'r' ? x - lebar : x
  const garis: Garis[] = []
  for (const k of teks.toUpperCase()) {
    const [maju, g] = glyph(JUDUL, 'j', k)
    for (const p of g) garis.push(p.map(([gx, gy]) => [kx + gx * s, y + gy * s]))
    kx += maju * s
  }
  const isi = o.isi ?? 'w'
  const tebal = Math.max(1.6, ukuran * 0.055)
  const ops: Op[] = []
  const bayang = o.bayang === undefined ? 'r' : o.bayang
  if (bayang) {
    const d = ukuran * 0.07
    ops.push(grup([G(garis, bayang, tebal * 0.9, { lintasan: 1, amp: 0.3, a: 0.75 })], geser(d, d)))
  }
  ops.push(
    A(garis, isi, {
      jarak: Math.max(1.6, ukuran * 0.075),
      sudut: 62,
      w: tebal * 1.05,
      a: 0.9,
      inset: 0.1,
    }),
  )
  ops.push(G(garis, isi, tebal, { lintasan: 1, amp: 0.25, lebih: 0.2 }))
  return ops
}
