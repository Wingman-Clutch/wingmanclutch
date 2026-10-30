// Tookthel: struk panjang yang sobek di bawah, dengan tumpukan koin. Isi struknya berganti:
// daftar pesanan dengan pajak dan service, bagian tiap orang, lalu cap LUNAS.

import { A, G, grup, TEPI, type Op } from '../engine/goresan'
import { elips, kilau, kotak, putar } from '../engine/jalur'
import { bayangan, bulatan, centang, GARIS, kecil, label, TITIK } from './bantu'

const MIRING = putar(4, 100, 92)

function sobekan() {
  let d = 'M52 8 H148 V166'
  for (let x = 148, naik = true; x > 52; x -= 8, naik = !naik) d += `L${x - 4} ${naik ? 173 : 166}`
  return d + 'L52 166 Z'
}

export function tookthel(denganLabel = true): Op[] {
  const koin = (cx: number, cy: number) => [
    G(elips(cx, cy, 15, 5.5), 'w', 2.8, { lintasan: 1, amp: 0.2 }),
    A(elips(cx, cy, 14, 4.6), 'y', { jarak: 2.2, sudut: 10, w: 2.6, a: 0.75 }),
    G(`M${cx - 15} ${cy} V${cy + 5} Q${cx} ${cy + 12} ${cx + 15} ${cy + 5} V${cy}`, 'w', 2.8, {
      lintasan: 1,
      amp: 0.2,
    }),
  ]
  return [
    bayangan(100, 188, 76),
    grup(
      [
        G(sobekan(), 'w', 4.4, TEPI),
        A('M52 8 H148 V18 H52 Z', 'g', { jarak: 2.4, sudut: 0, w: 2.6, a: 0.5 }),
        kecil('STRUK', 100, 31, 8, 'k', 'c'),
        G('M58 36 H142', 'w', 1.8, { lintasan: 1, amp: 0.2, a: 0.6 }),
      ],
      MIRING,
    ),
    // tumpukan koin di kiri bawah
    ...koin(30, 176),
    ...koin(30, 166),
    ...koin(30, 156),
    kecil('RP', 30, 160, 6, 'k', 'c'),
    // persen melayang
    kecil('%', 176, 70, 20, 'o', 'c'),
    G(kilau(178, 30, 7), 'y', 3.2, { lintasan: 1, amp: 0.3 }),
    G(kilau(18, 60, 5), 'g', 3, { lintasan: 1, amp: 0.3 }),
    ...(denganLabel ? label('Tookthel', 'g') : []),
  ]
}

/** isi struk: di dalam 58..142 x 40..160 sebelum dimiringkan */
export const layarTookthel: (() => Op[])[] = [
  // pesanan, pajak, service
  () => {
    const baris = (y: number, kiri: string, kanan: string, c: 'k' | 'g' = 'k') => [
      kecil(kiri, 60, y, 6.2, c),
      kecil(kanan, 140, y, 6.2, c, 'r'),
    ]
    return [
      grup(
        [
          ...baris(52, 'KOPI SUSU X4', '100'),
          ...baris(66, 'MIE GORENG', '45'),
          ...baris(80, 'ES TEH X3', '24'),
          ...baris(94, 'KENTANG', '30'),
          G('M58 102 H142', 'w', 1.6, { lintasan: 1, amp: 0.2, a: 0.6 }),
          ...baris(114, 'PAJAK 10%', '20'),
          ...baris(128, 'SERVICE 5%', '10'),
          G('M58 136 H142', 'w', 1.6, { lintasan: 1, amp: 0.2, a: 0.6 }),
          ...baris(150, 'TOTAL', '229', 'g'),
        ],
        MIRING,
      ),
    ]
  },
  // bagian tiap orang
  () => {
    const orang = (i: number, nama: string, c: 'b' | 'p' | 'o' | 'r', jumlah: string) => {
      const y = 54 + i * 26
      return [
        ...bulatan(68, y, 7, c),
        kecil(nama[0], 68, y + 3, 6, 'k', 'c'),
        kecil(nama, 80, y + 3, 6.4, 'k'),
        kecil(jumlah, 140, y + 3, 6.4, 'k', 'r'),
      ]
    }
    return [
      grup(
        [
          kecil('BAGI 4', 100, 46, 6.6, 'g', 'c'),
          ...orang(0, 'KALL', 'b', '62'),
          ...orang(1, 'BINTANG', 'p', '58'),
          ...orang(2, 'SARI', 'o', '52'),
          ...orang(3, 'DIMAS', 'r', '57'),
          G('M66 160 L76 152 M134 152 L144 160', 'w', 1.6, GARIS),
        ],
        MIRING,
      ),
    ]
  },
  // lunas
  () => [
    grup(
      [
        ...[52, 70, 88].map((y) => G(centang(66, y, 4), 'g', 2.4, GARIS)),
        kecil('KALL', 76, 54.5, 6.2, 'k'),
        kecil('BINTANG', 76, 72.5, 6.2, 'k'),
        kecil('SARI', 76, 90.5, 6.2, 'k'),
        grup(
          [
            G(kotak(66, 108, 68, 30, 4), 'r', 3, { lintasan: 2, geser: 0.5, amp: 0.3 }),
            kecil('LUNAS!', 100, 128, 10, 'r', 'c'),
          ],
          putar(-12, 100, 123),
        ),
        G(kilau(140, 104, 4), 'y', 2, TITIK),
      ],
      MIRING,
    ),
  ],
]
