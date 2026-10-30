// PostPocket: amplop terbuka dengan kartu foil yang menyembul. Muka kartunya berganti:
// kartu foil, kalender Pocket, dan strip foto Booth.

import { A, G, grup, TEPI, type Op } from '../engine/goresan'
import { elips, geser, kali, kilau, kotak, lingkaran, putar } from '../engine/jalur'
import { bayangan, bulatan, GARIS, hati, kecil, label, TITIK } from './bantu'

export function postpocket(denganLabel = true): Op[] {
  const amplop = kotak(10, 94, 180, 80, 6)
  const kartu = 'M44 94 V24 Q44 18 50 18 H150 Q156 18 156 24 V94'
  return [
    bayangan(100, 182, 88),
    // tutup amplop yang terbuka, hanya bagian yang tidak tertutup kartu
    G('M12 95 L44 77 M156 77 L188 95', 'w', 3.4, { lintasan: 1, amp: 0.3 }),
    A('M12 95 L44 77 L44 95 Z', 'p', { jarak: 3, sudut: -30, w: 3, a: 0.55 }),
    A('M156 77 L188 95 L156 95 Z', 'p', { jarak: 3, sudut: 30, w: 3, a: 0.55 }),
    // kartu
    G(kartu, 'w', 3.8, TEPI),
    G('M140 22 L152 34 M134 22 L152 40', 'y', 2.2, { lintasan: 1, amp: 0.2 }),
    // badan amplop dan lipatannya
    G(amplop, 'w', 5.2, TEPI),
    A(amplop, 'p', { jarak: 4.2, sudut: -32, w: 3.6, a: 0.42, kurang: lingkaran(100, 128, 12) }),
    G('M12 172 L100 124 L188 172', 'w', 3.2, { lintasan: 1, lebih: 0, amp: 0.3 }),
    G('M12 97 L64 128 M188 97 L136 128', 'w', 2.4, { lintasan: 1, amp: 0.3, a: 0.7 }),
    // segel lilin
    G(lingkaran(100, 128, 12), 'r', 3.2, { lintasan: 1, amp: 0.3 }),
    A(lingkaran(100, 128, 11), 'r', {
      jarak: 2,
      sudut: 40,
      w: 2.8,
      a: 0.85,
      kurang: hati(100, 128, 5.5),
    }),
    G(hati(100, 128, 5.5), 'e', 1.8, GARIS),
    // hiasan
    G(kilau(26, 46, 9), 'y', 3.4, { lintasan: 1, amp: 0.3 }),
    G(kilau(178, 40, 6), 'w', 3, { lintasan: 1, amp: 0.3 }),
    G(kilau(186, 64, 3.6), 'y', 2.6, { lintasan: 1, amp: 0.2 }),
    G(hati(24, 76, 5), 'p', 2.8, { lintasan: 1, amp: 0.3 }),
    ...(denganLabel ? label('PostPocket', 'p') : []),
  ]
}

/** muka kartu: di dalam 50..150 x 24..92 */
export const layarPostpocket: (() => Op[])[] = [
  // kartu foil "Padang bunga"
  () => {
    const bunga = (x: number, y: number, r: number, c: 'p' | 'o' | 'b') => {
      const kelopak = Array.from({ length: 5 }, (_, i) => {
        const a = (i * 72 * Math.PI) / 180
        return elips(x + Math.cos(a) * r, y + Math.sin(a) * r, r * 0.75, r * 0.75)
      }).join('')
      return [
        G(`M${x} ${y + r} Q${x - 2} ${y + 18} ${x + 1} 96`, 'g', 2.2, GARIS),
        G(kelopak, 'k', 1.6, { lintasan: 1, amp: 0.1 }),
        A(kelopak, c, { jarak: 1.6, sudut: 35, w: 2.2, a: 0.7, inset: 0 }),
        ...bulatan(x, y, r * 0.55, 'y'),
      ]
    }
    return [
      kecil('UNTUKMU', 100, 36, 7.4, 'k', 'c'),
      ...bunga(70, 58, 6, 'p'),
      ...bunga(100, 66, 7.4, 'o'),
      ...bunga(129, 56, 5.6, 'b'),
      G('M58 82 Q64 76 70 82 M120 84 Q126 78 132 84', 'g', 2, GARIS),
      G(kilau(60, 42, 4), 'y', 2, TITIK),
      G(kilau(140, 40, 3.2), 'y', 2, TITIK),
      G(kilau(116, 74, 2.6), 'y', 1.8, TITIK),
    ]
  },
  // kalender Pocket: setiap hari satu kantong
  () => {
    const ops: Op[] = [kecil('OKT', 56, 34, 7.4, 'k'), kecil('POCKET', 144, 34, 6.4, 'k', 'r')]
    const isi = 'pybgo'
    for (let j = 0; j < 2; j++)
      for (let i = 0; i < 4; i++) {
        const x = 56 + i * 23
        const y = 44 + j * 25
        const kantong = `M${x} ${y} H${x + 18} V${y + 16} Q${x + 9} ${y + 21} ${x} ${y + 16} Z`
        ops.push(G(kantong, 'k', 1.8, { lintasan: 1, amp: 0.15 }))
        const k = i + j * 4
        if (k < 6)
          ops.push(
            A(kantong, isi[k % 5] as 'p', {
              jarak: 2,
              sudut: 30 + k * 20,
              w: 2.4,
              a: 0.65,
              inset: 0,
            }),
          )
        if (k === 5) ops.push(G(hati(x + 9, y + 8, 3.4), 'r', 1.8, GARIS))
      }
    return ops
  },
  // strip foto Booth
  () => {
    const ops: Op[] = [kecil('BOOTH', 100, 34, 7.4, 'k', 'c')]
    for (let i = 0; i < 3; i++) {
      const x = 58 + i * 30
      ops.push(G(kotak(x, 42, 26, 32, 2), 'k', 2, { lintasan: 1, amp: 0.12 }))
      ops.push(
        A(kotak(x + 1, 43, 24, 30, 2), 'w', { jarak: 2.4, sudut: 70, w: 2, a: 0.2, inset: 0 }),
      )
      const cx = x + 13
      ops.push(G(lingkaran(cx, 54, 6), 'k', 1.8, { lintasan: 1, amp: 0.15 }))
      ops.push(G(`M${cx - 2.6} 53 h0.6 M${cx + 2} 53 h0.6`, 'k', 2, TITIK))
      ops.push(
        G(
          i === 1 ? `M${cx - 3} 56 Q${cx} 60 ${cx + 3} 56` : `M${cx - 2.6} 57 h5.2`,
          'k',
          1.6,
          GARIS,
        ),
      )
      ops.push(
        G(`M${cx - 9} 74 Q${cx - 9} 63 ${cx} 63 Q${cx + 9} 63 ${cx + 9} 74`, 'k', 1.8, GARIS),
      )
    }
    ops.push(grup([G(hati(0, 0, 4), 'p', 2, GARIS)], kali(geser(140, 84), putar(-12))))
    ops.push(grup([G(kilau(0, 0, 4), 'y', 2, TITIK)], geser(66, 84)))
    return ops
  },
]
