import { describe, expect, it } from 'vitest'
import { isiLambang, letakMendatar, RASIO_LAMBANG } from '../src/halaman/merek'

describe('logo Wingman Clutch untuk kartu nama', () => {
  it('logo mendatar: lambang di kiri setinggi logo, WINGMAN dan CLUTCH bertumpuk di kanannya', () => {
    const { letak, w, h } = letakMendatar()
    const [lambang, wingman, clutch] = letak.map(({ b, x, y, s }) => ({
      x0: x,
      y0: y,
      x1: x + b.w * s,
      y1: y + b.h * s,
    }))
    expect(lambang).toMatchObject({ x0: 0, y0: 0 })
    expect(lambang.y1).toBeCloseTo(h)
    for (const k of [wingman, clutch]) {
      expect(k.x0).toBeGreaterThan(lambang.x1)
      expect(k.x1).toBeLessThanOrEqual(w + 0.01)
      expect(k.y0).toBeGreaterThan(0)
      expect(k.y1).toBeLessThan(h)
    }
    expect(clutch.y0).toBeGreaterThan(wingman.y1)
    // CLUTCH rata tengah di bawah WINGMAN, dan bloknya tegak di tengah lambang
    expect((clutch.x0 + clutch.x1) / 2).toBeCloseTo((wingman.x0 + wingman.x1) / 2)
    expect((wingman.y0 + clutch.y1) / 2).toBeCloseTo(h / 2)
  })

  it('lambang di kanvas tidak keluar dari kotak yang diminta', () => {
    const titik: [number, number][] = []
    let isi = ''
    const ctx = {
      beginPath() {},
      closePath() {},
      moveTo: (x: number, y: number) => titik.push([x, y]),
      lineTo: (x: number, y: number) => titik.push([x, y]),
      fill: (aturan: string) => (isi = aturan),
    } as unknown as CanvasRenderingContext2D
    isiLambang(ctx, 10, 20, 50)
    expect(isi).toBe('evenodd')
    expect(titik.length).toBeGreaterThan(50)
    const xs = titik.map((t) => t[0])
    const ys = titik.map((t) => t[1])
    expect(Math.min(...xs)).toBeCloseTo(10)
    expect(Math.max(...xs)).toBeCloseTo(10 + 50 * RASIO_LAMBANG)
    expect(Math.min(...ys)).toBeCloseTo(20)
    expect(Math.max(...ys)).toBeCloseTo(70)
  })
})
