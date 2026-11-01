/*!
 * Stiker digambar dengan kit fun-isometric karya Kelvin Adithya (kelvinkn17/skills).
 *
 * MIT License
 *
 * Copyright (c) 2026 kelvinkn17
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

// Stiker Wingman Clutch, digambar dengan kit fun-isometric (fun.ts dan motions.ts, tidak diubah).
// Warna memakai slot palet, jadi warnanya datang dari warna.ts. Cara menambah stiker ada di
// docs/frontend.md.

import { VIEWS, arc, line, rect, spark } from './fun'
import { sparkle, spring, twinkle, wiggle } from './motions'
import type { Icon, Layer, Motion, Vec } from './fun'

const LINE = 5
const { tilt: MUKA, extrude: TEBAL } = VIEWS.right

/** kilau putih di kanvas stiker, muncul di puncak gerakan */
const kilau = (p: Vec, r: number, m: Motion): Layer => ({
  a: p,
  p,
  m,
  shapes: [{ d: spark(p[0], p[1], r), fill: 'white' }],
})

/** titik di kanvas tempat ujung karet menyentuh kertas */
const UJUNG: Vec = [150, 330]

/** remah karet yang terlempar dari ujung penghapus, lalu mengecil dan hilang */
const remah = (ke: Vec, mulai: number, isi: 'main' | 'tint', w: number, h: number): Layer => ({
  a: UJUNG,
  p: UJUNG,
  ip: mulai,
  op: mulai + 110,
  m: [{ p: spring(ke, mulai) }, twinkle(mulai), twinkle(mulai + 80, true)],
  shapes: [{ d: rect(UJUNG[0] - w / 2, UJUNG[1] - h / 2, w, h, 4), fill: isi, depth: 0.3 }],
})

export const penghapus: Icon = {
  name: 'penghapus',
  frames: 180,
  // gosokan pertama selesai dan remahnya sudah keluar
  still: 74,
  line: LINE,
  extrude: TEBAL,
  layers: [
    remah([-58, 40], 46, 'main', 24, 15),
    remah([-70, -10], 54, 'tint', 16, 12),
    remah([-18, 62], 72, 'main', 17, 13),
    remah([-72, 26], 104, 'tint', 21, 13),
    // tangan memegang ujung selongsong, jadi ujung karetnya yang menyapu kertas
    { id: 'tangan', a: [336, 160], p: [336, 160], m: wiggle, shapes: [] },
    { id: 'badan', parent: 'tangan', a: [0, 0], p: [250, 246], r: -14, tilt: MUKA, shapes: [] },
    // karetnya lentur, jadi telat sedikit dari selongsong
    {
      parent: 'badan',
      a: [-48, 0],
      p: [-48, 0],
      m: { ...wiggle, at: 5, k: 0.22 },
      shapes: [
        { d: rect(-156, -56, 312, 112, 30), fill: 'main', depth: 1 },
        { d: rect(-136, -40, 62, 18, 9), fill: 'tint', depth: 0.12, line: false },
      ],
    },
    {
      parent: 'badan',
      shapes: [
        { d: rect(-48, -64, 210, 128, 10), fill: 'white', depth: 1.12 },
        { d: rect(-48, -64, 30, 128), fill: 'deep', depth: 1.12 },
        { d: rect(2, -36, 130, 72, 8), fill: 'tint', depth: 0.25 },
        { d: line([20, -18], [34, 18], [48, -6], [62, 18], [76, -18]), line: 7 },
        { d: arc(100, 0, 19, 50, 310), line: 7 },
      ],
    },
    kilau([66, 188], 26, sparkle(46)),
    kilau([226, 392], 18, sparkle(62)),
  ],
}
