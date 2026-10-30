import { describe, expect, it } from 'vitest'
import { batasGoresan, kompilasi } from '../src/engine/goresan'
import { celahTinta, judul, lebarJudul, lebarTulisan, tulis } from '../src/engine/huruf'

describe('tulisan tangan', () => {
  it('huruf sempit seperti I tidak menempel ke tetangganya', () => {
    // dulu "WIN" terbaca "WN" dan "INI:" terbaca "N!:" karena jarak huruf dikali lebar glyph
    const biasa = celahTinta('WANGSA MENEMBAK', 28).sort((a, b) => a - b)
    const tengah = biasa[Math.floor(biasa.length / 2)]
    for (const teks of ['WIN', 'IDE', 'INI:', 'KAMI?', 'AMBIL PENSIL!'])
      expect(Math.min(...celahTinta(teks, 28)), teks).toBeGreaterThan(tengah * 0.8)
  })

  it('jarak huruf yang tidak sempit tetap seperti sebelumnya', () => {
    // 655 dan 621 = lebar maju N dan E di data font; tata letak halaman bergantung pada ini
    expect(lebarTulisan('NE', 670)).toBeCloseTo((655 + 621) * 1.08)
  })

  it('lebar sebanding dengan ukuran', () => {
    expect(lebarTulisan('HALO', 40)).toBeCloseTo(lebarTulisan('HALO', 20) * 2)
  })

  it('rata tengah menaruh tulisan di sekitar x', () => {
    const b = batasGoresan(kompilasi([tulis('WINGMAN', 100, 50, 20, 'w', { rata: 'c' })], 1))
    expect(b.x + b.w / 2).toBeGreaterThan(90)
    expect(b.x + b.w / 2).toBeLessThan(110)
  })

  it('huruf yang tidak dikenal tidak membuat galat', () => {
    expect(() => kompilasi([tulis('é→ok', 0, 0, 20)], 1)).not.toThrow()
  })
})

describe('judul', () => {
  it('huruf kecil ditulis kapital dengan lebar yang sama', () => {
    expect(lebarJudul('tim kami', 30)).toBeCloseTo(lebarJudul('TIM KAMI', 30))
  })

  it('tinggi huruf kapital mendekati ukurannya', () => {
    const b = batasGoresan(kompilasi(judul('H', 0, 100, 40, { bayang: null }), 1))
    expect(b.h).toBeGreaterThan(36)
    expect(b.h).toBeLessThan(50)
  })
})
