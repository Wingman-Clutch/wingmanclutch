import { describe, expect, it } from 'vitest'
import { AMBANG_KLIK, jangkauanLampu, saklar, TARIK_MAKS } from '../src/halaman/lampu'

describe('saklar tarik lampu', () => {
  it('berbunyi sekali saat tarikan melewati ambang', () => {
    let siap = true
    const klik: number[] = []
    for (const tarik of [0, 5, 10, AMBANG_KLIK + 0.1, TARIK_MAKS, TARIK_MAKS, AMBANG_KLIK + 2]) {
      const s = saklar(siap, tarik)
      siap = s.siap
      if (s.klik) klik.push(tarik)
    }
    expect(klik).toEqual([AMBANG_KLIK + 0.1])
  })

  it('baru bisa berbunyi lagi setelah talinya kembali masuk', () => {
    let siap = true
    let bunyi = 0
    // tarik penuh, lepas setengah, tarik lagi: tetap satu kali
    for (const tarik of [TARIK_MAKS, AMBANG_KLIK - 3, TARIK_MAKS]) {
      const s = saklar(siap, tarik)
      siap = s.siap
      bunyi += +s.klik
    }
    expect(bunyi).toBe(1)
    // lepas sampai hampir masuk semua, lalu tarik lagi: berbunyi lagi
    for (const tarik of [0.5, TARIK_MAKS]) {
      const s = saklar(siap, tarik)
      siap = s.siap
      bunyi += +s.klik
    }
    expect(bunyi).toBe(2)
  })

  it('tarikan pendek tidak menyalakan atau mematikan lampu', () => {
    expect(saklar(true, AMBANG_KLIK - 0.5).klik).toBe(false)
  })
})

describe('jangkauan lampu', () => {
  it('tali tergantung di bawah gambar lampu dan cukup panjang untuk ditarik', () => {
    const j = jangkauanLampu({ x: 100, y: 0, w: 120, tali: 60 })
    expect(j.tali.y0).toBeGreaterThan(j.gambar.y0)
    expect(j.tali.y1).toBeGreaterThan(j.gambar.y1)
    expect(j.tali.x0).toBeGreaterThanOrEqual(j.gambar.x0 - 14)
  })
})
