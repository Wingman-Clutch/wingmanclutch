// Sketsa ditulis sebagai daftar Op (goresan, arsiran, grup). Kompilasi mengubahnya jadi Goresan:
// polyline yang sudah diberi goyangan tangan, siap digambar sedikit demi sedikit oleh kuas.

import { buatAcak, type Acak } from './acak'
import {
  IDENTITAS,
  kali,
  sampelUlang,
  skalaMatriks,
  terapkan,
  uraiPath,
  type Garis,
  type Matriks,
} from './jalur'

/** w grafit, k hitam, e warna kertas, sisanya pensil warna */
export type KodeWarna = 'w' | 'k' | 'e' | 'y' | 'p' | 'b' | 'g' | 'o' | 'r' | 'n'

export interface OpsiGores {
  /** berapa kali garis ditarik (2 = garis tepi yang tegas) */
  lintasan?: number
  /** jarak antarlintasan */
  geser?: number
  /** besar goyangan tangan */
  amp?: number
  /** garis kebablasan di ujung, kelipatan lebar */
  lebih?: number
  /** kepekatan 0..1 */
  a?: number
}

export interface OpsiArsir {
  /** jarak antargaris arsir */
  jarak?: number
  /** sudut arsir dalam derajat */
  sudut?: number
  /** lebar garis arsir */
  w?: number
  a?: number
  /** bentuk yang tidak ikut diarsir (lubang) */
  kurang?: string
  /** arsir berhenti sejauh ini dari tepi */
  inset?: number
}

export type Op =
  | { k: 'gores'; d: string | Garis[]; c: KodeWarna; w: number; o: OpsiGores }
  | { k: 'arsir'; d: string | Garis[]; c: KodeWarna; o: OpsiArsir }
  | { k: 'grup'; ops: Op[]; m: Matriks }

export interface Goresan {
  /** x, y berselang */
  titik: ArrayLike<number>
  /** panjang kumulatif sampai setiap titik */
  kum: ArrayLike<number>
  panjang: number
  lebar: number
  warna: KodeWarna
  alfa: number
}

// ---------- pembuat op (dipakai semua sketsa) ----------

export const G = (d: string | Garis[], c: KodeWarna, w: number, o: OpsiGores = {}): Op => ({
  k: 'gores',
  d,
  c,
  w,
  o,
})
export const A = (d: string | Garis[], c: KodeWarna, o: OpsiArsir = {}): Op => ({
  k: 'arsir',
  d,
  c,
  o,
})
export const grup = (ops: Op[], m: Matriks): Op => ({ k: 'grup', ops, m })

/** gaya garis yang sering dipakai */
export const TEPI: OpsiGores = { lintasan: 2, geser: 0.5, amp: 0.4 }
export const GARIS: OpsiGores = { lintasan: 1, lebih: 0, amp: 0.2 }
export const TITIK: OpsiGores = { lintasan: 1, lebih: 0, amp: 0 }

// ---------- goyangan tangan ----------

function normalDi(g: Garis, i: number): [number, number] {
  const a = g[Math.max(0, i - 1)]
  const b = g[Math.min(g.length - 1, i + 1)]
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const l = Math.hypot(dx, dy) || 1
  return [-dy / l, dx / l]
}

function goyang(g: Garis, amp: number, lebih: number, acak: Acak): Garis {
  const s = sampelUlang(g, 2)
  if (s.length < 2) return s
  // Ujung yang kebablasan: tangan jarang berhenti tepat di titiknya.
  if (lebih > 0) {
    const ujung = (i: number, j: number) => {
      const dx = s[i][0] - s[j][0]
      const dy = s[i][1] - s[j][1]
      const l = Math.hypot(dx, dy) || 1
      const k = lebih * acak(0.2, 1)
      return [s[i][0] + (dx / l) * k, s[i][1] + (dy / l) * k] as [number, number]
    }
    s[0] = ujung(0, 1)
    s[s.length - 1] = ujung(s.length - 1, s.length - 2)
  }
  if (amp <= 0) return s
  const f1 = acak(0.012, 0.03)
  const f2 = acak(0.05, 0.11)
  const p1 = acak(0, Math.PI * 2)
  const p2 = acak(0, Math.PI * 2)
  const awal = acak(-0.6, 0.6) * amp
  const akhir = acak(-0.6, 0.6) * amp
  const n = s.length - 1
  let jarak = 0
  return s.map((p, i) => {
    if (i) jarak += Math.hypot(p[0] - s[i - 1][0], p[1] - s[i - 1][1])
    const [nx, ny] = normalDi(s, i)
    const o =
      amp *
        (0.75 * Math.sin(jarak * f1 * Math.PI * 2 + p1) +
          0.35 * Math.sin(jarak * f2 * Math.PI * 2 + p2)) +
      awal +
      (akhir - awal) * (i / n)
    return [p[0] + nx * o, p[1] + ny * o]
  })
}

function keGoresan(g: Garis, lebar: number, warna: KodeWarna, alfa: number): Goresan | null {
  if (g.length < 2) return null
  const titik = new Float32Array(g.length * 2)
  const kum = new Float32Array(g.length)
  let l = 0
  for (let i = 0; i < g.length; i++) {
    titik[i * 2] = g[i][0]
    titik[i * 2 + 1] = g[i][1]
    if (i) l += Math.hypot(g[i][0] - g[i - 1][0], g[i][1] - g[i - 1][1])
    kum[i] = l
  }
  if (l < 0.01) return null
  return { titik, kum, panjang: l, lebar, warna, alfa }
}

// ---------- arsiran ----------

/** potongan garis horizontal y dengan semua tepi poligon (aturan genap-ganjil) */
function potongDatar(poligon: Garis[], y: number): number[] {
  const xs: number[] = []
  for (const p of poligon) {
    for (let i = 0; i < p.length; i++) {
      const a = p[i]
      const b = p[(i + 1) % p.length]
      if (a[1] <= y !== b[1] <= y) xs.push(a[0] + ((y - a[1]) * (b[0] - a[0])) / (b[1] - a[1]))
    }
  }
  return xs.sort((m, n) => m - n)
}

function keRentang(xs: number[]): [number, number][] {
  const r: [number, number][] = []
  for (let i = 0; i + 1 < xs.length; i += 2) r.push([xs[i], xs[i + 1]])
  return r
}

function kurangiRentang(a: [number, number][], b: [number, number][]): [number, number][] {
  let hasil = a
  for (const [b0, b1] of b) {
    const baru: [number, number][] = []
    for (const [a0, a1] of hasil) {
      if (b1 <= a0 || b0 >= a1) baru.push([a0, a1])
      else {
        if (b0 > a0) baru.push([a0, b0])
        if (b1 < a1) baru.push([b1, a1])
      }
    }
    hasil = baru
  }
  return hasil
}

/** garis arsir di dalam bentuk; dikembalikan dalam koordinat bentuk */
export function garisArsir(
  bentuk: Garis[],
  o: Required<Pick<OpsiArsir, 'jarak' | 'sudut' | 'inset'>> & { kurang?: Garis[] },
  acak: Acak,
): Garis[] {
  const a = (-o.sudut * Math.PI) / 180
  const putarKe = putarSudut(a)
  const balik = putarSudut(-a)
  const poli = bentuk.map((g) => terapkan(putarKe, g))
  const lubang = o.kurang?.map((g) => terapkan(putarKe, g))
  let y0 = Infinity
  let y1 = -Infinity
  for (const p of poli)
    for (const t of p) {
      y0 = Math.min(y0, t[1])
      y1 = Math.max(y1, t[1])
    }
  const hasil: Garis[] = []
  let arah = 1
  for (let y = y0 + o.jarak * acak(0.3, 0.8); y < y1; y += o.jarak * acak(0.85, 1.15)) {
    let rentang = keRentang(potongDatar(poli, y))
    if (lubang) rentang = kurangiRentang(rentang, keRentang(potongDatar(lubang, y)))
    for (const [x0, x1] of rentang) {
      const a0 = x0 + o.inset + acak(-0.4, 0.9) * o.inset
      const a1 = x1 - o.inset - acak(-0.4, 0.9) * o.inset
      if (a1 - a0 < o.jarak * 0.4) continue
      const yy = y + acak(-0.15, 0.15) * o.jarak
      const g: Garis =
        arah > 0
          ? [
              [a0, yy],
              [a1, yy + acak(-0.2, 0.2) * o.jarak],
            ]
          : [
              [a1, yy],
              [a0, yy + acak(-0.2, 0.2) * o.jarak],
            ]
      hasil.push(terapkan(balik, g))
      arah = -arah
    }
  }
  return hasil
}

function putarSudut(a: number): Matriks {
  return [Math.cos(a), Math.sin(a), -Math.sin(a), Math.cos(a), 0, 0]
}

// ---------- kompilasi ----------

const cacheUrai = new Map<string, Garis[]>()
function urai(d: string | Garis[]): Garis[] {
  if (typeof d !== 'string') return d
  let g = cacheUrai.get(d)
  if (!g) {
    g = uraiPath(d)
    if (cacheUrai.size > 4000) cacheUrai.clear()
    cacheUrai.set(d, g)
  }
  return g
}

export function kompilasi(ops: Op[], benih: number): Goresan[] {
  const acak = buatAcak(benih)
  const keluar: Goresan[] = []
  const jalan = (daftar: Op[], m: Matriks) => {
    for (const op of daftar) {
      if (op.k === 'grup') {
        jalan(op.ops, kali(m, op.m))
        continue
      }
      const s = skalaMatriks(m)
      const bentuk = urai(op.d).map((g) => terapkan(m, g))
      if (op.k === 'gores') {
        const lintasan = op.o.lintasan ?? 2
        const geser = (op.o.geser ?? 0.6) * s
        const amp = (op.o.amp ?? 0.6) * s
        const lebih = (op.o.lebih ?? 0.6) * op.w * s
        const alfa = op.o.a ?? 1
        for (const g of bentuk) {
          for (let l = 0; l < lintasan; l++) {
            let gg = g
            if (l > 0) {
              const dx = acak(-1, 1) * geser
              const dy = acak(-1, 1) * geser
              gg = g.map(([x, y]) => [x + dx, y + dy])
            }
            const hasil = keGoresan(
              goyang(gg, amp, lebih, acak),
              op.w * s,
              op.c,
              l ? alfa * 0.7 : alfa,
            )
            if (hasil) keluar.push(hasil)
          }
        }
      } else {
        const w = (op.o.w ?? 3) * s
        const jarak = (op.o.jarak ?? 3.4) * s
        const kurang = op.o.kurang ? urai(op.o.kurang).map((g) => terapkan(m, g)) : undefined
        const garis = garisArsir(
          bentuk,
          { jarak, sudut: op.o.sudut ?? 30, inset: (op.o.inset ?? 0.5) * w, kurang },
          acak,
        )
        for (const g of garis) {
          const hasil = keGoresan(goyang(g, 0.25 * s, 0, acak), w, op.c, op.o.a ?? 0.8)
          if (hasil) keluar.push(hasil)
        }
      }
    }
  }
  jalan(ops, IDENTITAS)
  return keluar
}

/** kotak pembatas semua goresan, termasuk setengah lebar garis */
export function batasGoresan(daftar: Goresan[]) {
  let x0 = Infinity
  let y0 = Infinity
  let x1 = -Infinity
  let y1 = -Infinity
  for (const g of daftar) {
    const r = g.lebar / 2 + 1
    for (let i = 0; i < g.titik.length; i += 2) {
      const x = g.titik[i]
      const y = g.titik[i + 1]
      if (x - r < x0) x0 = x - r
      if (y - r < y0) y0 = y - r
      if (x + r > x1) x1 = x + r
      if (y + r > y1) y1 = y + r
    }
  }
  if (!Number.isFinite(x0)) return { x: 0, y: 0, w: 1, h: 1 }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }
}
