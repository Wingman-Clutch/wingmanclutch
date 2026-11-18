import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { TIM } from '../src/data/proyek'

const FOTO = TIM.flatMap((a) => (a.foto ? [[a.panggilan, a.foto] as const] : []))

/** lebar dan tinggi JPEG dari penanda SOF di kepala berkasnya */
function ukuranJpeg(b: Buffer) {
  for (let i = 2; i + 9 < b.length; i += 2 + b.readUInt16BE(i + 2)) {
    const penanda = b[i + 1]
    // SOF0 sampai SOF15, kecuali C4 (DHT), C8 (JPG), dan CC (DAC) yang bukan SOF
    if (penanda >= 0xc0 && penanda <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(penanda))
      return { w: b.readUInt16BE(i + 7), h: b.readUInt16BE(i + 5) }
  }
  throw new Error('kepala JPEG tidak terbaca')
}

// sketsaFoto meregangkan foto ke kanvas persegi, dan bagian yang transparan jadi hitam
describe('foto tim', () => {
  it.each(FOTO)('foto %s berupa JPEG (tidak transparan) dan persegi', (_, foto) => {
    const b = readFileSync(new URL(`../public${foto}`, import.meta.url))
    expect(b.readUInt16BE(0), 'bukan JPEG').toBe(0xffd8)
    const { w, h } = ukuranJpeg(b)
    expect(w).toBe(h)
  })
})
