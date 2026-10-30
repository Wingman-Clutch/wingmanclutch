// Potongan gambar yang dipakai banyak sketsa.

import { A, G, GARIS, TITIK, type KodeWarna, type Op, type OpsiGores } from '../engine/goresan'
import { judul, lebarJudul, tulis, type Rata } from '../engine/huruf'
import { elips, gelombang, kotak, lingkaran } from '../engine/jalur'

/** garis dasar label nama di bawah setiap sketsa perangkat (satuan gambar) */
export const DASAR_LABEL = 236

/** bayangan pensil tipis di bawah benda */
export const bayangan = (cx: number, cy: number, rx: number): Op =>
  A(elips(cx, cy, rx, 5), 'w', { jarak: 2.6, sudut: -10, w: 3, a: 0.22 })

/** nama sketsa dengan garis bergelombang berwarna di bawahnya */
export function label(nama: string, c: KodeWarna, maks = 34): Op[] {
  // nama panjang dikecilkan supaya tidak lebih lebar dari sketsanya
  const ukuran = Math.min(maks, 178 / lebarJudul(nama, 1))
  const w = lebarJudul(nama, ukuran)
  return [
    ...judul(nama, 100, DASAR_LABEL, ukuran, { rata: 'c', bayang: null }),
    G(gelombang(100 - w / 2, 100 + w / 2 + 6, DASAR_LABEL + 14, 2.6, 16), c, 4.4, {
      lintasan: 1,
      amp: 0.5,
    }),
  ]
}

/** tulisan kecil di layar, garisnya cukup tipis supaya terbaca */
export const kecil = (
  teks: string,
  x: number,
  y: number,
  ukuran: number,
  c: KodeWarna = 'k',
  rata: Rata = 'l',
  o: OpsiGores = {},
) => tulis(teks, x, y, ukuran, c, { rata, jarak: 1.08, w: Math.max(1.6, ukuran * 0.22), a: o.a })

/** kotak bergaris dengan arsiran warna */
export const kotakArsir = (
  x: number,
  y: number,
  w: number,
  h: number,
  c: KodeWarna,
  a = 0.6,
  r = 3,
): Op[] => [
  G(kotak(x, y, w, h, r), 'k', 2.2, { lintasan: 1, amp: 0.12 }),
  A(kotak(x + 0.8, y + 0.8, w - 1.6, h - 1.6, r), c, {
    jarak: 2.2,
    sudut: 30,
    w: 2.6,
    a,
    inset: 0,
  }),
]

/** bulatan bergaris dengan isi warna */
export const bulatan = (
  x: number,
  y: number,
  r: number,
  c: KodeWarna,
  garis: KodeWarna = 'k',
): Op[] => [
  G(lingkaran(x, y, r), garis, 2.2, { lintasan: 1, amp: 0.12 }),
  A(lingkaran(x, y, Math.max(0.5, r - 0.8)), c, { jarak: 1.6, sudut: 30, w: 2.4, inset: 0 }),
]

/** hati kecil */
export const hati = (cx: number, cy: number, r: number) =>
  `M${cx} ${cy + r * 0.9}C${cx - r * 1.6} ${cy - r * 0.2} ${cx - r * 0.7} ${cy - r * 1.3} ${cx} ${cy - r * 0.45}` +
  `C${cx + r * 0.7} ${cy - r * 1.3} ${cx + r * 1.6} ${cy - r * 0.2} ${cx} ${cy + r * 0.9}Z`

/** pin peta */
export const pin = (x: number, y: number, r: number) =>
  `M${x} ${y}C${x - r * 0.4} ${y - r * 0.9} ${x - r} ${y - r * 1.2} ${x - r} ${y - r * 1.8}` +
  `A${r} ${r} 0 1 1 ${x + r} ${y - r * 1.8}C${x + r} ${y - r * 1.2} ${x + r * 0.4} ${y - r * 0.9} ${x} ${y}Z`

/** centang */
export const centang = (x: number, y: number, s: number) =>
  `M${x - s} ${y}L${x - s * 0.3} ${y + s * 0.7}L${x + s} ${y - s * 0.8}`

export { GARIS, TITIK }
