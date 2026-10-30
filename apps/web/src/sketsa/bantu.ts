// Potongan gambar yang dipakai banyak sketsa.

import { G, type KodeWarna, type Op } from '../engine/goresan'
import { judul, lebarJudul } from '../engine/huruf'
import { gelombang } from '../engine/jalur'

/** garis dasar label nama di bawah setiap figur aplikasi (satuan gambar) */
export const DASAR_LABEL = 236

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

/** hati kecil */
export const hati = (cx: number, cy: number, r: number) =>
  `M${cx} ${cy + r * 0.9}C${cx - r * 1.6} ${cy - r * 0.2} ${cx - r * 0.7} ${cy - r * 1.3} ${cx} ${cy - r * 0.45}` +
  `C${cx + r * 0.7} ${cy - r * 1.3} ${cx + r * 1.6} ${cy - r * 0.2} ${cx} ${cy + r * 0.9}Z`
