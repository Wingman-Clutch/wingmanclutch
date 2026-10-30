import { describe, expect, it } from 'vitest'
import { buatAcak } from '../src/engine/acak'
import { A, batasGoresan, G, garisArsir, kompilasi } from '../src/engine/goresan'
import { kotak, lingkaran, uraiPath, type Garis } from '../src/engine/jalur'

function diDalam(p: [number, number], poli: Garis) {
  let masuk = false
  for (let i = 0, j = poli.length - 1; i < poli.length; j = i++) {
    const [xi, yi] = poli[i]
    const [xj, yj] = poli[j]
    if (yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) masuk = !masuk
  }
  return masuk
}

describe('garisArsir', () => {
  const kotakBesar = uraiPath(kotak(0, 0, 100, 60))
  it('garis arsir tetap di dalam bentuk, paling jauh kebablasan setengah jarak arsir', () => {
    const garis = garisArsir(kotakBesar, { jarak: 4, sudut: 30, inset: 1 }, buatAcak(1))
    expect(garis.length).toBeGreaterThan(10)
    const titik = garis.flat()
    const dalam = titik.filter((p) => diDalam(p, kotakBesar[0])).length
    expect(dalam / titik.length).toBeGreaterThan(0.9)
    for (const [x, y] of titik) {
      expect(x).toBeGreaterThan(-2)
      expect(x).toBeLessThan(102)
      expect(y).toBeGreaterThan(-2)
      expect(y).toBeLessThan(62)
    }
  })

  it('tidak mengarsir lubang', () => {
    const lubang = uraiPath(lingkaran(50, 30, 15))
    const garis = garisArsir(
      kotakBesar,
      { jarak: 3, sudut: 0, inset: 0, kurang: lubang },
      buatAcak(2),
    )
    for (const g of garis) {
      const tengah: [number, number] = [(g[0][0] + g[1][0]) / 2, (g[0][1] + g[1][1]) / 2]
      expect(Math.hypot(tengah[0] - 50, tengah[1] - 30)).toBeGreaterThan(14)
    }
  })
})

describe('kompilasi', () => {
  const ops = [G(kotak(0, 0, 50, 50, 6), 'w', 3), A(lingkaran(25, 25, 15), 'p', { jarak: 3 })]
  it('selalu sama untuk benih yang sama', () => {
    const a = kompilasi(ops, 7)
    const b = kompilasi(ops, 7)
    expect(a.length).toBe(b.length)
    expect(Array.from(a[0].titik)).toEqual(Array.from(b[0].titik))
  })

  it('berbeda untuk benih lain, seperti tangan yang menggambar ulang', () => {
    const a = kompilasi(ops, 7)
    const c = kompilasi(ops, 8)
    expect(Array.from(a[0].titik)).not.toEqual(Array.from(c[0].titik))
  })

  it('kotak pembatas mencakup lebar garis', () => {
    const b = batasGoresan(
      kompilasi([G('M0 0 L100 0', 'w', 10, { lintasan: 1, amp: 0, lebih: 0 })], 1),
    )
    expect(b.y).toBeLessThanOrEqual(-5)
    expect(b.h).toBeGreaterThanOrEqual(10)
    expect(b.w).toBeGreaterThanOrEqual(100)
  })
})
