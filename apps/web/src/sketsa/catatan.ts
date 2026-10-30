// Catatan kecil di halaman: kertas tempel Tentang kami, dua orang tos, kopi hari ini,
// petunjuk, kotak kontak, rumus, kilau, bulan dan matahari, serta tanggal hari ini.

import { A, G, grup, TITIK, type Op } from '../engine/goresan'
import { judul, lebarJudul, lebarTulisan, tulis } from '../engine/huruf'
import { geser, gelombang, kepalaPanah, kilau, kotak, lingkaran } from '../engine/jalur'
import { GARIS, hati } from './bantu'

export function tentang(): Op[] {
  const w = lebarJudul('tentang', 30)
  return [
    // bingkai tak terlihat: ukuran kertas tempelnya 220 x 220
    G(kotak(0, 0, 220, 220), 'e', 0.5, { lintasan: 1, amp: 0, lebih: 0, a: 0 }),
    ...judul('tentang', 110, 92, 30, { rata: 'c' }),
    ...judul('kami', 110, 132, 30, { rata: 'c' }),
    G(gelombang(110 - w / 2, 110 + w / 2 + 6, 146, 2.6, 16), 'r', 4.2, { lintasan: 1, amp: 0.5 }),
    tulis('SIAPA KAMI?', 110, 184, 20, 'w', { rata: 'c', jarak: 1.1 }),
    G(kilau(190, 34, 8), 'o', 3.4, { lintasan: 1, amp: 0.3 }),
  ]
}

/** dua orang tos di atas judul Tim kami */
export function tim(): Op[] {
  const w = lebarJudul('tim kami', 30)
  const badan = (cx: number, c: 'b' | 'g', tanganKe: number) => {
    const bahu = `M${cx - 20} 110 Q${cx - 20} 82 ${cx} 82 Q${cx + 20} 82 ${cx + 20} 110`
    return [
      G(lingkaran(cx, 62, 14), 'w', 3.2, { lintasan: 1, amp: 0.3 }),
      G(`M${cx - 5} 60 h1.4 M${cx + 4} 60 h1.4`, 'w', 2.8, TITIK),
      G(`M${cx - 5} 66 Q${cx} 71 ${cx + 5} 66`, 'w', 2.2, GARIS),
      G(bahu, 'w', 3.4, { lintasan: 1, lebih: 0.3 }),
      A(bahu + 'Z', c, { jarak: 2.8, sudut: 35, w: 3.2, a: 0.7 }),
      // lengan terangkat ke tengah untuk tos
      G(`M${cx + 14 * tanganKe} 86 Q${cx + 26 * tanganKe} 60 ${100 - 6 * tanganKe} 30`, 'w', 3.4, {
        lintasan: 1,
        lebih: 0.2,
      }),
    ]
  }
  return [
    ...badan(60, 'b', 1),
    // rambut Kall: poni lebat
    G('M46 58 Q46 42 60 42 Q76 42 75 58 M47 54 L52 60 L55 52 L60 60 L64 52 L68 60 L72 53', 'w', 3, {
      lintasan: 1,
      amp: 0.2,
    }),
    ...badan(140, 'g', -1),
    // rambut Bintang: ikal
    G('M126 58 Q122 44 132 42 Q136 34 146 40 Q156 40 154 54', 'w', 3, { lintasan: 1, amp: 0.3 }),
    G('M130 44 q2 -4 5 0 M140 41 q3 -3 5 1 M148 46 q3 -2 4 2', 'w', 2.4, GARIS),
    G(kilau(100, 22, 10), 'y', 3.4, { lintasan: 1, amp: 0.3 }),
    G('M86 14 L80 8 M114 14 L120 8 M100 6 V0', 'y', 2.6, GARIS),
    ...judul('tim kami', 100, 150, 30, { rata: 'c' }),
    G(gelombang(100 - w / 2, 100 + w / 2 + 6, 166, 2.6, 16), 'o', 4.2, { lintasan: 1, amp: 0.5 }),
  ]
}

export function kopi(): Op[] {
  return [
    G(kotak(8, 36, 44, 46, 7), 'w', 5),
    G('M52 46 C68 46 68 70 52 70', 'w', 4.6, { lintasan: 1 }),
    A(kotak(12, 46, 36, 32, 5), 'n', { jarak: 4.2, sudut: -30, a: 0.6 }),
    G('M20 28 C14 20 26 14 20 4 M36 28 C30 20 42 14 36 4', 'w', 3.4, { lintasan: 1, lebih: 0 }),
    tulis('HARI INI:', 80, 30, 22, 'w', { jarak: 1.08 }),
    G('M84 44 L84 80 M96 44 L96 80 M108 44 L108 80 M120 44 L120 80', 'w', 4.6, {
      lintasan: 1,
      lebih: 1.5,
    }),
    G('M76 74 L128 48', 'w', 4.6, { lintasan: 1 }),
    G('M144 44 L144 80 M156 44 L156 80', 'w', 4.6, { lintasan: 1, lebih: 1.5 }),
    tulis('?!', 170, 80, 30, 'r'),
  ]
}

/** "Ketuk sketsanya" dengan panah ke bawah (potret) atau ke kiri dan kanan (lanskap) */
export function petunjukKetuk(arah: 'bawah' | 'samping'): Op[] {
  if (arah === 'bawah') {
    return [
      tulis('KETUK SKETSANYA!', 0, 32, 28, 'b', { jarak: 1.08 }),
      G('M-8 22 C-40 28 -54 52 -48 84', 'b', 4.4, { lintasan: 1 }),
      G(kepalaPanah(-48, 84, 96, 12), 'b', 4.4, { lintasan: 1, lebih: 0 }),
    ]
  }
  const w = lebarTulisan('KETUK SKETSANYA', 28) * 1.0
  return [
    tulis('KETUK SKETSANYA', 0, 32, 28, 'b', { rata: 'c', jarak: 1.08 }),
    G(`M${-w / 2 - 18} 20 L${-w / 2 - 78} 20`, 'b', 4.4, { lintasan: 1 }),
    G(kepalaPanah(-w / 2 - 78, 20, 180, 12), 'b', 4.4, { lintasan: 1, lebih: 0 }),
    G(`M${w / 2 + 18} 20 L${w / 2 + 78} 20`, 'b', 4.4, { lintasan: 1 }),
    G(kepalaPanah(w / 2 + 78, 20, 0, 12), 'b', 4.4, { lintasan: 1, lebih: 0 }),
  ]
}

export function kotakKontak(): Op[] {
  const ukuran = Math.min(40, 400 / lebarJudul("let's clutch it", 1))
  const w = lebarJudul("let's clutch it", ukuran)
  return [
    tulis('JANGAN DIHAPUS', 260, 22, 20, 'r', { rata: 'c', jarak: 1.18 }),
    G(kotak(12, 34, 496, 122, 10), 'w', 5.5, { amp: 1.4 }),
    tulis('PUNYA IDE?', 260, 80, 28, 'w', { rata: 'c', jarak: 1.1 }),
    ...judul("let's clutch it", 236, 136, ukuran, { rata: 'c' }),
    G(`M${236 + w / 2 + 14} 120 L${236 + w / 2 + 52} 120`, 'r', 5, { lintasan: 1 }),
    G(kepalaPanah(236 + w / 2 + 52, 120, 0, 12), 'r', 5, { lintasan: 1, lebih: 0 }),
  ]
}

export function petunjukPensil(): Op[] {
  return [
    tulis('AMBIL PENSIL!', 0, 30, 24, 'w', { jarak: 1.08 }),
    G('M-6 20 C-30 24 -46 40 -50 66', 'w', 4, { lintasan: 1 }),
    G(kepalaPanah(-50, 66, 100, 11), 'w', 4, { lintasan: 1, lebih: 0 }),
  ]
}

/** "FE + BE = ♥": Kall di frontend, Bintang di backend */
export function rumus(): Op[] {
  const dx = lebarTulisan('FE + BE =', 26, 1.08) + 18
  const h = hati(dx + 20, 26, 14)
  return [
    tulis('FE + BE =', 0, 34, 26, 'w', { jarak: 1.08 }),
    grup([G(h, 'p', 4.5), A(h, 'p', { jarak: 3.6, sudut: 40, w: 4 })], geser(0, 0)),
  ]
}

export function kilauKecil(): Op[] {
  return [
    G(kilau(10, 10, 9), 'o', 3.6, { lintasan: 1, amp: 0.4 }),
    G(kilau(40, 34, 5), 'w', 3, { lintasan: 1, amp: 0.3 }),
  ]
}

/** saklar tema di samping tanggal: bulan di kertas terang, matahari di kertas gelap */
export function bulan(): Op[] {
  const d = 'M81.3 41 A30 30 0 1 0 77 90 A28 28 0 0 1 81.3 41 Z'
  return [
    G(d, 'w', 4.4),
    A(d, 'y', { jarak: 3.4, sudut: 35, w: 3.8 }),
    G(kilau(102, 36, 7), 'w', 3, { lintasan: 1, amp: 0.3 }),
    G(kilau(106, 80, 4.5), 'y', 2.8, { lintasan: 1, amp: 0.3 }),
  ]
}

export function matahari(): Op[] {
  const sinar = Array.from({ length: 8 }, (_, i) => {
    const a = ((i * 45 + 10) * Math.PI) / 180
    return `M${65 + Math.cos(a) * 28} ${65 + Math.sin(a) * 28}L${65 + Math.cos(a) * 39} ${65 + Math.sin(a) * 39}`
  }).join('')
  return [
    G(lingkaran(65, 65, 19), 'w', 4.4),
    A(lingkaran(65, 65, 18), 'y', { jarak: 3.4, sudut: 35, w: 3.8 }),
    G(sinar, 'o', 4, { lintasan: 1, lebih: 0.4 }),
  ]
}

const BULAN = ['JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGU', 'SEP', 'OKT', 'NOV', 'DES']
export function teksTanggal(d = new Date()) {
  return `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`
}
export function tanggal(): Op[] {
  return [tulis(teksTanggal(), 0, 0, 28, 'w', { jarak: 1.08 })]
}
