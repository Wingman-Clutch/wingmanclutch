import { describe, expect, it } from 'vitest'
import {
  langkahPutar,
  langkahVerlet,
  sudutAyun,
  tegangkan,
  type Putaran,
  type Sambungan,
  type Simpul,
} from '../src/engine/tali'

const simpul = (x: number, y: number, w = 1): Simpul => ({ x, y, px: x, py: y, w })

describe('fisika tali lanyard', () => {
  it('simpul yang dipaku tidak bergerak, simpul bebas jatuh karena gravitasi', () => {
    const paku = simpul(0, 0, 0)
    const bebas = simpul(10, 0)
    langkahVerlet([paku, bebas], 0.1, 100, 1)
    expect(paku).toMatchObject({ x: 0, y: 0 })
    expect(bebas.x).toBe(10)
    expect(bebas.y).toBeCloseTo(1)
    // langkah berikutnya membawa kecepatan dari langkah sebelumnya
    langkahVerlet([paku, bebas], 0.1, 100, 1)
    expect(bebas.y).toBeCloseTo(3)
  })

  it('redaman memperlambat simpul yang sedang bergerak', () => {
    const p = { x: 10, y: 0, px: 0, py: 0, w: 1 }
    langkahVerlet([p], 0.1, 0, 0.5)
    expect(p.x).toBeCloseTo(15)
  })

  it('sambungan kembali ke panjang diamnya, dan hanya simpul bebas yang bergeser', () => {
    const s = [simpul(0, 0, 0), simpul(30, 0)]
    const sambungan: Sambungan[] = [[0, 1, 10]]
    tegangkan(s, sambungan, 1)
    expect(s[0]).toMatchObject({ x: 0, y: 0 })
    expect(s[1].x).toBeCloseTo(10)

    const dua = [simpul(0, 0), simpul(30, 0)]
    tegangkan(dua, sambungan, 1)
    // dua simpul sama berat bergeser sama jauh ke tengah
    expect(dua[0].x).toBeCloseTo(10)
    expect(dua[1].x).toBeCloseTo(20)
  })

  it('tali panjang tetap tersambung setelah ditarik', () => {
    const s = Array.from({ length: 6 }, (_, i) => simpul(0, i * 10, i ? 1 : 0))
    const sambungan: Sambungan[] = s.slice(1).map((_, i) => [i, i + 1, 10])
    s[5].x = 80
    for (let i = 0; i < 40; i++) tegangkan(s, sambungan, 8)
    for (const [a, b, diam] of sambungan)
      expect(Math.hypot(s[b].x - s[a].x, s[b].y - s[a].y)).toBeCloseTo(diam, 1)
  })

  it('putaran kartu kembali ke sasarannya dan berhenti di sana', () => {
    const p: Putaran = { a: 0, v: 5 }
    for (let i = 0; i < 2400; i++) langkahPutar(p, Math.PI, 1 / 120, 0)
    expect(p.a).toBeCloseTo(Math.PI, 3)
    expect(Math.abs(p.v)).toBeLessThan(1e-3)
  })

  it('sudut ayun nol saat tergantung lurus, positif saat kartu berayun ke kanan', () => {
    expect(sudutAyun(simpul(0, 0), simpul(0, 50))).toBe(0)
    expect(sudutAyun(simpul(0, 0), simpul(20, 50))).toBeGreaterThan(0)
    expect(sudutAyun(simpul(0, 0), simpul(-20, 50))).toBeLessThan(0)
  })
})
