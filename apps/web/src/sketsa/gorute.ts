// goRute: papan halte di tiang dengan bus TransJakarta yang lewat. Papannya berganti:
// jalur dengan halte transit, papan keberangkatan, dan ringkasan perjalanan pintu ke pintu.

import { A, G, TEPI, type Op } from '../engine/goresan'
import { kilau, kotak, lingkaran, putus } from '../engine/jalur'
import { bayangan, bulatan, GARIS, kecil, kotakArsir, label, TITIK } from './bantu'

export function gorute(denganLabel = true): Op[] {
  const papan = kotak(14, 8, 172, 106, 8)
  const kepala = 'M14 30 V16 Q14 8 22 8 H178 Q186 8 186 16 V30 Z'
  const bus = kotak(84, 130, 110, 44, 9)
  const jendela = [
    kotak(92, 137, 20, 15, 3),
    kotak(116, 137, 20, 15, 3),
    kotak(140, 137, 20, 15, 3),
    kotak(166, 136, 20, 17, 4),
  ]
  return [
    bayangan(118, 188, 82),
    // tiang dan papan
    G('M50 114 V186 M56 114 V186', 'w', 3.6, { lintasan: 1, amp: 0.2 }),
    G('M38 188 H68', 'w', 4.4, GARIS),
    G(papan, 'w', 5.2, TEPI),
    A(kepala, 'b', { jarak: 2.6, sudut: 15, w: 3, a: 0.7 }),
    G('M14 30 H186', 'w', 3, GARIS),
    G(lingkaran(28, 19, 5), 'e', 2.4, TITIK),
    G('M26 17 L30 21 M30 17 L26 21', 'e', 1.6, TITIK),
    // bus
    G(bus, 'w', 4.6, TEPI),
    A(bus, 'b', { jarak: 3.6, sudut: -30, w: 3.2, a: 0.5, kurang: jendela.join('') }),
    ...jendela.map((j) => G(j, 'w', 2.4, { lintasan: 1, amp: 0.15 })),
    G('M86 160 H192', 'y', 3.4, { lintasan: 1, amp: 0.2 }),
    G('M156 154 V170', 'w', 2.2, GARIS),
    ...bulatan(106, 175, 8, 'w'),
    ...bulatan(172, 175, 8, 'w'),
    G(lingkaran(106, 175, 3), 'e', 2, TITIK),
    G(lingkaran(172, 175, 3), 'e', 2, TITIK),
    // garis laju
    G('M64 142 H76 M60 152 H74 M64 162 H76', 'w', 2.6, { lintasan: 1, lebih: 0, amp: 0.2 }),
    G(kilau(194, 112, 6), 'y', 3, { lintasan: 1, amp: 0.3 }),
    G(kilau(8, 128, 4.4), 'w', 2.6, { lintasan: 1, amp: 0.3 }),
    ...(denganLabel ? label('goRute', 'b') : []),
  ]
}

/** isi papan: di dalam 22..178 x 36..108; judul papan di 40..176 x 14..28 */
export const layarGorute: (() => Op[])[] = [
  // jalur dua koridor dengan halte transit
  () => {
    const halte = [28, 60, 92, 124, 156, 172]
    return [
      kecil('BLOK M - KOTA', 108, 24, 7.4, 'k', 'c'),
      G('M28 70 H92', 'b', 4.4, { lintasan: 1, amp: 0.2 }),
      G('M92 70 H172', 'o', 4.4, { lintasan: 1, amp: 0.2 }),
      ...halte.flatMap((x) => [
        G(lingkaran(x, 70, x === 92 ? 6 : 4), 'k', 2, { lintasan: 1, amp: 0.1 }),
        A(lingkaran(x, 70, x === 92 ? 5 : 3), 'e', { jarak: 1.2, sudut: 0, w: 2, inset: 0 }),
      ]),
      kecil('BLOK M', 28, 92, 6.4, 'k', 'c'),
      kecil('TRANSIT', 92, 56, 6, 'o', 'c'),
      kecil('KOTA', 172, 92, 6.4, 'k', 'c'),
      G(putus(28, 46, 28, 62, 3, 3), 'w', 1.8, TITIK),
      G(lingkaran(28, 42, 3), 'w', 1.8, TITIK),
    ]
  },
  // papan keberangkatan
  () => {
    const baris = (i: number, kode: string, c: 'b' | 'o' | 'r', tujuan: string, menit: string) => {
      const y = 44 + i * 22
      return [
        ...kotakArsir(26, y, 22, 14, c, 0.75, 4),
        kecil(kode, 37, y + 10.5, 7, 'k', 'c'),
        kecil(tujuan, 56, y + 10.5, 7.4, 'k'),
        kecil(menit, 174, y + 10.5, 7.4, 'k', 'r'),
      ]
    }
    return [
      kecil('BERANGKAT', 108, 24, 7.4, 'k', 'c'),
      ...baris(0, '1', 'b', 'KOTA', "3'"),
      ...baris(1, '9A', 'o', 'GROGOL', "7'"),
      ...baris(2, '13', 'r', 'PURI BETA', "12'"),
    ]
  },
  // ringkasan pintu ke pintu
  () => {
    const orang = (x: number, y: number) =>
      `M${x} ${y - 9} m-2.4 0 a2.4 2.4 0 1 0 4.8 0 a2.4 2.4 0 1 0 -4.8 0 M${x} ${y - 6} V${y + 2} M${x} ${y + 2} L${x - 4} ${y + 9} M${x} ${y + 2} L${x + 4} ${y + 9} M${x - 4} ${y - 3} L${x + 4} ${y - 1}`
    return [
      kecil('PINTU KE PINTU', 108, 24, 7.4, 'k', 'c'),
      G(orang(36, 60), 'k', 2, GARIS),
      kecil("5'", 36, 82, 7, 'k', 'c'),
      G('M48 60 H62', 'w', 2, GARIS),
      ...kotakArsir(68, 50, 64, 20, 'b', 0.6, 6),
      kecil("TJ 22'", 100, 64, 8, 'k', 'c'),
      G('M138 60 H152', 'w', 2, GARIS),
      G(orang(164, 60), 'k', 2, GARIS),
      kecil("4'", 164, 82, 7, 'k', 'c'),
      kecil('RP3.500', 100, 102, 8, 'g', 'c'),
    ]
  },
]
