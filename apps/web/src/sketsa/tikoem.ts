// Tikoem: HP yang sedikit miring. Layarnya berganti: peta tiga teman menuju satu titik,
// daftar tempat yang waktu tempuhnya seimbang, dan tempat yang sudah ditetapkan.

import { A, G, grup, TEPI, type Op } from '../engine/goresan'
import { kilau, kotak, lingkaran, putar, putus } from '../engine/jalur'
import { bayangan, bulatan, centang, GARIS, kecil, kotakArsir, label, pin, TITIK } from './bantu'

/** HP dimiringkan sedikit; layarnya ikut miring dengan sudut yang sama */
const MIRING = putar(-5, 101, 92)

export function tikoem(denganLabel = true): Op[] {
  const badan = kotak(58, 6, 86, 172, 16)
  const layar = kotak(66, 22, 70, 140, 6)
  return [
    bayangan(100, 190, 62),
    grup(
      [
        G(badan, 'w', 5.4, TEPI),
        A(badan, 'w', { jarak: 2.6, sudut: 70, w: 3, a: 0.85, kurang: layar }),
        G(layar, 'w', 2.2, { lintasan: 1, amp: 0.1 }),
        G('M90 14 H112', 'e', 3, GARIS),
        G('M146 44 V62 M146 70 V80', 'w', 3.4, GARIS),
        G('M92 170 H110', 'e', 2.6, GARIS),
      ],
      MIRING,
    ),
    // getar notifikasi
    G('M44 72 Q36 86 44 100 M34 66 Q23 86 34 106', 'w', 3, { lintasan: 1, lebih: 0, amp: 0.3 }),
    // gelembung: tiga teman sudah bergabung
    G(kotak(148, 30, 44, 22, 11), 'r', 3, { lintasan: 1, amp: 0.3 }),
    A(kotak(149, 31, 42, 20, 10), 'r', { jarak: 2.8, sudut: 20, w: 3, a: 0.3 }),
    kecil('+3', 170, 46, 10, 'r', 'c'),
    G(kilau(24, 140, 7), 'o', 3.2, { lintasan: 1, amp: 0.3 }),
    G(kilau(180, 120, 5), 'y', 3, { lintasan: 1, amp: 0.3 }),
    ...(denganLabel ? label('Tikoem', 'r') : []),
  ]
}

/** isi layar HP: di dalam 66..136 x 22..162 sebelum dimiringkan */
export const layarTikoem: (() => Op[])[] = [
  // peta: tiga teman dan titik kumpulnya
  () => [
    grup(
      [
        kecil('TIKOEM', 101, 34, 6.6, 'k', 'c'),
        G('M66 60 Q90 70 136 52 M66 118 Q100 100 136 128 M96 22 Q90 90 112 162', 'w', 1.6, {
          lintasan: 1,
          amp: 0.4,
          a: 0.35,
        }),
        G(putus(80, 60, 100, 92, 4, 3), 'b', 1.8, TITIK),
        G(putus(124, 68, 102, 92, 4, 3), 'g', 1.8, TITIK),
        G(putus(86, 138, 100, 96, 4, 3), 'o', 1.8, TITIK),
        G(pin(80, 60, 5), 'k', 1.8, { lintasan: 1, amp: 0.1 }),
        A(pin(80, 60, 5), 'b', { jarak: 1.6, sudut: 30, w: 2.2, inset: 0 }),
        G(pin(124, 68, 5), 'k', 1.8, { lintasan: 1, amp: 0.1 }),
        A(pin(124, 68, 5), 'g', { jarak: 1.6, sudut: 30, w: 2.2, inset: 0 }),
        G(pin(86, 138, 5), 'k', 1.8, { lintasan: 1, amp: 0.1 }),
        A(pin(86, 138, 5), 'o', { jarak: 1.6, sudut: 30, w: 2.2, inset: 0 }),
        G(kilau(101, 94, 8), 'r', 2.6, { lintasan: 1, amp: 0.1 }),
        A(kilau(101, 94, 7), 'r', { jarak: 1.4, sudut: 30, w: 2.2, inset: 0 }),
        ...kotakArsir(74, 146, 54, 12, 'r', 0.7, 6),
        kecil('CARI TEMPAT', 101, 155, 5.4, 'k', 'c'),
      ],
      MIRING,
    ),
  ],
  // tiga tempat dengan waktu tempuh yang seimbang
  () => {
    const baris = (i: number, nama: string, menit: string, panjang: number[]) => {
      const y = 50 + i * 34
      const ops: Op[] = [
        ...bulatan(76, y, 5, i === 0 ? 'r' : 'w'),
        kecil(String(i + 1), 76, y + 3, 5.6, 'e', 'c'),
        kecil(nama, 86, y + 3, 6, 'k'),
        kecil(menit, 131, y + 3, 6, 'k', 'r'),
      ]
      panjang.forEach((l, k) => {
        const yy = y + 9 + k * 4
        ops.push(G(`M86 ${yy} H${86 + l}`, (['b', 'g', 'o'] as const)[k], 2.4, GARIS))
      })
      return ops
    }
    return [
      grup(
        [
          kecil('3 TEMPAT', 101, 34, 6.6, 'k', 'c'),
          ...baris(0, 'KOPI', "18'", [36, 34, 37]),
          ...baris(1, 'TAMAN', "21'", [26, 44, 30]),
          ...baris(2, 'MIE', "24'", [46, 22, 40]),
          G(kilau(130, 40, 4), 'y', 2, TITIK),
        ],
        MIRING,
      ),
    ]
  },
  // sudah ditetapkan
  () => [
    grup(
      [
        G(lingkaran(101, 70, 22), 'g', 3, { lintasan: 1, amp: 0.2 }),
        A(lingkaran(101, 70, 21), 'g', { jarak: 2.4, sudut: 40, w: 2.8, a: 0.5 }),
        G(centang(101, 70, 11), 'k', 3.6, { lintasan: 1, amp: 0.15 }),
        kecil('FIX!', 101, 112, 11, 'k', 'c'),
        kecil('JAM 19.00', 101, 126, 6.6, 'k', 'c'),
        ...kotakArsir(74, 140, 54, 14, 'g', 0.8, 7),
        kecil('BAGIKAN', 101, 150, 5.6, 'k', 'c'),
      ],
      MIRING,
    ),
  ],
]
