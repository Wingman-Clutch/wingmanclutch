import { describe, expect, it } from 'vitest'
import {
  kotak,
  lingkaran,
  panjangGaris,
  putar,
  sampelUlang,
  terapkan,
  uraiPath,
} from '../src/engine/jalur'

describe('uraiPath', () => {
  it('membaca M, L, H, V, dan Z absolut', () => {
    const [g] = uraiPath('M0 0 L10 0 H20 V5 Z')
    expect(g).toEqual([
      [0, 0],
      [10, 0],
      [20, 0],
      [20, 5],
      [0, 0],
    ])
  })

  it('membaca perintah relatif dan pasangan angka setelah M sebagai L', () => {
    const [g] = uraiPath('m5 5 10 0 l0 10 h-10 v-10')
    expect(g).toEqual([
      [5, 5],
      [15, 5],
      [15, 15],
      [5, 15],
      [5, 5],
    ])
  })

  it('memecah subpath di setiap M', () => {
    expect(uraiPath('M0 0 L1 1 M5 5 L6 6')).toHaveLength(2)
  })

  it('kurva C dan Q berakhir tepat di titik ujungnya', () => {
    const [c] = uraiPath('M0 0 C10 20 30 20 40 0')
    expect(c[c.length - 1]).toEqual([40, 0])
    expect(c.length).toBeGreaterThan(4)
    const [q] = uraiPath('M0 0 Q20 20 40 0 T80 0')
    expect(q[q.length - 1][0]).toBeCloseTo(80)
    expect(q[q.length - 1][1]).toBeCloseTo(0)
  })

  it('busur A menghasilkan lingkaran dengan jari-jari yang benar', () => {
    const [g] = uraiPath(lingkaran(50, 50, 20))
    for (const [x, y] of g) expect(Math.hypot(x - 50, y - 50)).toBeCloseTo(20, 0)
    expect(panjangGaris(g)).toBeCloseTo(2 * Math.PI * 20, -1)
  })

  it('kotak bersudut bulat tertutup dan sebesar ukurannya', () => {
    const [g] = uraiPath(kotak(10, 20, 100, 50, 8))
    const xs = g.map((p) => p[0])
    const ys = g.map((p) => p[1])
    expect(Math.min(...xs)).toBeCloseTo(10)
    expect(Math.max(...xs)).toBeCloseTo(110)
    expect(Math.min(...ys)).toBeCloseTo(20)
    expect(Math.max(...ys)).toBeCloseTo(70)
    expect(g[0]).toEqual(g[g.length - 1])
  })

  it('mengabaikan token aneh tanpa merusak sisanya', () => {
    expect(uraiPath('M0 0 L10 10 X L20 20')[0].length).toBeGreaterThanOrEqual(2)
  })
})

describe('bantuan geometri', () => {
  it('sampelUlang membuat jarak antartitik hampir sama', () => {
    const g = sampelUlang(
      [
        [0, 0],
        [100, 0],
      ],
      5,
    )
    expect(g.length).toBe(21)
    for (let i = 1; i < g.length; i++) expect(g[i][0] - g[i - 1][0]).toBeCloseTo(5)
  })

  it('putar 90 derajat di sekitar titik', () => {
    const [[x, y]] = terapkan(putar(90, 10, 10), [[20, 10]])
    expect(x).toBeCloseTo(10)
    expect(y).toBeCloseTo(20)
  })
})
