import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { batasGoresan, kompilasi } from '../src/engine/goresan'
import { daftarDef } from '../src/halaman/papan'
import { atasItem, atasKaki, hitungUkuran, pilihTata, TATA } from '../src/halaman/tata-letak'

const defs = daftarDef()

function kotakDi(kunci: 'potret' | 'lanskap', id: string) {
  const L = TATA[kunci]
  const d = defs.find((x) => x.id === id)!
  const t = L.item[d.tempat ?? id]
  if (!t) return null
  const b = batasGoresan(kompilasi([...d.ops(), ...(d.layar?.flatMap((l) => l()) ?? [])], 1))
  const atas = atasItem(L, t, d.dasar)
  return {
    x0: t.x + b.x * t.s,
    y0: atas + b.y * t.s,
    x1: t.x + (b.x + b.w) * t.s,
    y1: atas + (b.y + b.h) * t.s,
  }
}

describe('tata letak', () => {
  it('memilih potret untuk layar sempit dan lanskap untuk layar lebar', () => {
    expect(pilihTata(390, 844)).toBe('potret')
    expect(pilihTata(1440, 900)).toBe('lanskap')
    expect(pilihTata(1024, 1366)).toBe('potret')
  })

  it('adegan selalu muat di layar tanpa scroll', () => {
    for (const [w, h] of [
      [320, 568],
      [390, 844],
      [768, 1024],
      [1280, 720],
      [1920, 1080],
    ]) {
      const u = hitungUkuran(w, h)
      expect(u.L.W * u.k).toBeLessThanOrEqual(w + 0.01)
      expect(u.atas + u.L.H * u.k).toBeLessThanOrEqual(h + 0.01)
    }
  })

  it('setiap posisi di tata letak dipakai sebuah sketsa', () => {
    const tempat = new Set(defs.map((d) => d.tempat ?? d.id))
    for (const L of Object.values(TATA))
      for (const k of Object.keys(L.item)) expect(tempat).toContain(k)
  })

  for (const kunci of ['potret', 'lanskap'] as const) {
    it(`semua sketsa ${kunci} berada di dalam halaman`, () => {
      const L = TATA[kunci]
      for (const d of defs) {
        const k = kotakDi(kunci, d.id)
        if (!k) continue
        expect.soft(k.x0, `${d.id} kiri`).toBeGreaterThan(-12)
        expect.soft(k.y0, `${d.id} atas`).toBeGreaterThan(-12)
        expect.soft(k.x1, `${d.id} kanan`).toBeLessThan(L.W + 12)
        expect.soft(k.y1, `${d.id} bawah`).toBeLessThan(L.H + 12)
      }
    })

    it(`logo, empat aplikasi, kontak, dan tim tidak saling tindih (${kunci})`, () => {
      const utama = ['logo', 'postpocket', 'gorute', 'tikoem', 'tookthel', 'kontak', 'tim']
      const kotak = utama.map((id) => [id, kotakDi(kunci, id)!] as const)
      for (let i = 0; i < kotak.length; i++)
        for (let j = i + 1; j < kotak.length; j++) {
          const [a, ka] = kotak[i]
          const [b, kb] = kotak[j]
          // toleransi 4% untuk garis yang kebablasan
          const sx = Math.min(ka.x1, kb.x1) - Math.max(ka.x0, kb.x0)
          const sy = Math.min(ka.y1, kb.y1) - Math.max(ka.y0, kb.y0)
          const tumpang =
            sx > 0 && sy > 0
              ? (sx * sy) /
                Math.min((ka.x1 - ka.x0) * (ka.y1 - ka.y0), (kb.x1 - kb.x0) * (kb.y1 - kb.y0))
              : 0
          expect.soft(tumpang, `${a} dan ${b}`).toBeLessThan(0.04)
        }
    })
  }
})

/** jalankan skrip di <head> index.html untuk satu ukuran layar; kembalikan yang dipasangnya */
function skripAwal(lebar: number, tinggi: number) {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8')
  const skrip = html.match(/<script>([\s\S]*?)<\/script>/)![1]
  const gaya = new Map<string, string>()
  const akar = {
    dataset: {} as Record<string, string>,
    style: { setProperty: (k: string, v: string) => gaya.set(k, v) },
  }
  new Function('document', 'innerWidth', 'innerHeight', 'localStorage', 'matchMedia', skrip)(
    { documentElement: akar, querySelector: () => ({}) },
    lebar,
    tinggi,
    { getItem: () => null },
    () => ({ matches: false }),
  )
  return { tata: akar.dataset.tata, u: gaya.get('--u')!, kaki: gaya.get('--kaki')! }
}

describe('tata letak sebelum skrip utama jalan', () => {
  // termasuk tepat di batas potret/lanskap (lebar/tinggi = 0,92)
  for (const [w, h] of [
    [320, 568],
    [390, 844],
    [412, 915],
    [919, 1000],
    [920, 1000],
    [768, 1024],
    [1280, 720],
    [1440, 900],
    [1920, 1080],
  ]) {
    it(`skrip di <head> sama dengan hitungUkuran dan atasKaki (${w}x${h})`, () => {
      const u = hitungUkuran(w, h)
      const awal = skripAwal(w, h)
      expect(awal.tata).toBe(u.kunci)
      expect(parseFloat(awal.u)).toBeCloseTo(u.k, 9)
      expect(parseFloat(awal.kaki)).toBeCloseTo(atasKaki(u), 9)
    })
  }
})
