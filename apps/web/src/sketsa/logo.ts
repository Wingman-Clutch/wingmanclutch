// Logo Wingman Clutch versi pensil: lambang dua orang bersayap, WINGMAN, CLUTCH, dan tagline
// tulisan tangan. Setiap ketukan di logo menambah satu kepakan sayap.

import data from '../data/logo.json'
import { A, G, grup, type Op } from '../engine/goresan'
import { tulis } from '../engine/huruf'
import { geser, kilau } from '../engine/jalur'

/** garis dasar tagline, dipakai tata letak untuk menaruh logo di garis buku */
export const DASAR_LOGO = 700
/** tengah lambang secara horizontal */
const TENGAH = 438.5

export function logo(): Op[] {
  return [
    grup([G(data.lambang, 'b', 7, { lintasan: 1, amp: 0.6, a: 0.7 })], geser(14, 12)),
    A(data.lambang, 'w', { jarak: 7.5, sudut: 55, w: 5.6, a: 0.92, inset: 0.2 }),
    G(data.lambang, 'w', 7, { lintasan: 2, geser: 1.2, amp: 0.9, lebih: 0.8 }),
    grup([G(data.wingman, 'b', 4.4, { lintasan: 1, amp: 0.4, a: 0.7 })], geser(7, 6)),
    A(data.wingman, 'w', { jarak: 4.6, sudut: 62, w: 3.8, a: 0.92, inset: 0.1 }),
    G(data.wingman, 'w', 4.4, { lintasan: 1, amp: 0.4, lebih: 0.4 }),
    grup([G(data.clutch, 'b', 3.6, { lintasan: 1, amp: 0.3, a: 0.7 })], geser(5, 5)),
    A(data.clutch, 'w', { jarak: 3.8, sudut: 62, w: 3.2, a: 0.92, inset: 0.1 }),
    G(data.clutch, 'w', 3.6, { lintasan: 1, amp: 0.3, lebih: 0.4 }),
    tulis('TWO IS ENOUGH TO WIN.', TENGAH, DASAR_LOGO, 34, 'w', { rata: 'c', jarak: 1.12 }),
  ]
}

/** garis kepak di kiri dan kanan sayap; i = 0 untuk kepakan pertama */
function kepak(i: number): string {
  const jauh = 46 + i * 34
  const y = 150 + (i % 2) * 26
  const kiri = 93 - jauh
  const kanan = 784 + jauh
  const tinggi = 52 - i * 6
  return (
    `M${kiri + 18} ${y - tinggi}Q${kiri - 8} ${y} ${kiri + 18} ${y + tinggi}` +
    `M${kanan - 18} ${y - tinggi}Q${kanan + 8} ${y} ${kanan - 18} ${y + tinggi}`
  )
}

/** kepakan yang langsung digambar setelah logo */
export function kepakAwal(): Op[] {
  return [G(kepak(0), 'o', 6, { lintasan: 1, amp: 1, lebih: 0.6 })]
}

/** kepakan tambahan setiap logo diketuk, paling banyak JUMLAH_KEPAK */
export const JUMLAH_KEPAK = 4
export function kepakTambahan(i: number): Op[] {
  const warna = (['y', 'p', 'g', 'b'] as const)[i % 4]
  const x = i % 2 ? 784 + 60 + i * 30 : 93 - 60 - i * 30
  return [
    G(kepak(i + 1), warna, 5.4, { lintasan: 1, amp: 1, lebih: 0.6 }),
    G(kilau(x, 40 + i * 14, 16 - i * 2), warna, 4, { lintasan: 1, amp: 0.6 }),
  ]
}
