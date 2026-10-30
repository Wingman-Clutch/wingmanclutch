import { describe, expect, it } from 'vitest'
import { hitungLipatan } from '../src/halaman/lipatan'
import { teksTanggal } from '../src/sketsa/catatan'

describe('lipatan sudut halaman', () => {
  it('tanpa tarikan tidak ada yang terlipat', () => {
    const l = hitungLipatan(800, 600, [800, 0])
    expect(l.terbuka).toEqual([])
    expect(l.balik).toEqual([])
  })

  it('tarikan kecil di diagonal membuka segitiga di pojok', () => {
    const l = hitungLipatan(800, 600, [760, 40])
    expect(l.terbuka).toHaveLength(3)
    for (const [x, y] of l.terbuka) {
      expect(x).toBeGreaterThanOrEqual(760 - 0.01)
      expect(y).toBeLessThanOrEqual(40 + 0.01)
    }
  })

  it('punggung halaman adalah pantulan bagian yang terbuka, jadi pojoknya jatuh di titik tarikan', () => {
    const P: [number, number] = [700, 120]
    const l = hitungLipatan(800, 600, P)
    const pojok = l.terbuka.findIndex(([x, y]) => x === 800 && y === 0)
    expect(pojok).toBeGreaterThanOrEqual(0)
    expect(l.balik[pojok][0]).toBeCloseTo(P[0])
    expect(l.balik[pojok][1]).toBeCloseTo(P[1])
  })

  it('tarikan jauh membuka seluruh halaman', () => {
    const l = hitungLipatan(800, 600, [-900, 1300])
    expect(l.terbuka).toHaveLength(4)
  })
})

describe('tanggal', () => {
  it('ditulis dengan nama bulan Indonesia', () => {
    expect(teksTanggal(new Date(2026, 9, 30))).toBe('30 OKT 2026')
    expect(teksTanggal(new Date(2027, 4, 1))).toBe('1 MEI 2027')
  })
})
