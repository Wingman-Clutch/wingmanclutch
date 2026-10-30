// Logo Wingman Clutch di halaman: lambang dua orang bersayap berupa figur Colorfigures, lalu WINGMAN,
// CLUTCH, dan tagline yang ditulis mesin pensil. Setiap ketukan di lambang mengepakkan sayapnya dan
// menambah satu garis kepak.

import data from '../data/logo.json'
import UKURAN from '../data/figur.json'
import { A, G, grup, type Op } from '../engine/goresan'
import { tulis } from '../engine/huruf'
import { geser, kilau } from '../engine/jalur'
import type { Figur } from '../engine/sketsa'

/** garis dasar tagline, dipakai tata letak untuk menaruh logo di garis buku */
export const DASAR_LOGO = 700
/** tengah lambang secara horizontal */
const TENGAH = 438.5

/** lambang figur di tempat lambang pensil dulu (x 93..784, y 14..412), sedikit lebih besar karena tebal */
export const FIGUR_LOGO: Figur = (() => {
  const { w, h } = UKURAN.logo
  const kotak = { x: 78, y: 0, w: 721, h: 430 }
  const s = Math.min(kotak.w / w, kotak.h / h)
  return {
    src: '/figur/logo.webp',
    x: kotak.x + (kotak.w - w * s) / 2,
    y: kotak.y + kotak.h - h * s,
    w: w * s,
    h: h * s,
  }
})()

/** WINGMAN, CLUTCH, dan tagline di bawah lambang */
export function merek(): Op[] {
  return [
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

export type Pose = 'naik' | 'turun'

/** pose sayap lambang, sebingkai dengan logo.webp; dimuat sekali saat pertama dibutuhkan */
let pose: Promise<Record<Pose, HTMLImageElement> | null> | undefined
export function muatPose() {
  pose ??= Promise.all(
    (['naik', 'turun'] as const).map(async (p) => {
      const img = new Image()
      img.src = `/figur/logo-${p}.webp`
      await img.decode()
      return [p, img] as const
    }),
  )
    .then((daftar) => Object.fromEntries(daftar) as Record<Pose, HTMLImageElement>)
    // pose gagal dimuat: sayapnya diam, sisanya tetap jalan
    .catch(() => null)
  return pose
}

/** urutan satu kepakan; null = pose diam */
export const KEPAKAN: (Pose | null)[] = ['naik', null, 'turun', null]

/**
 * Kepakkan sayap `kali` kali: `tampil` dipanggil dengan setiap pose, berselang `jeda` ms. Selesai
 * di pose diam. Kalau pose belum termuat, tidak ada yang terjadi.
 */
export async function kepakkan(tampil: (p: HTMLImageElement | null) => void, kali = 1, jeda = 85) {
  const img = await muatPose()
  if (!img) return
  for (let i = 0; i < kali * KEPAKAN.length; i++) {
    const p = KEPAKAN[i % KEPAKAN.length]
    tampil(p ? img[p] : null)
    await new Promise((r) => setTimeout(r, jeda))
  }
  tampil(null)
}
