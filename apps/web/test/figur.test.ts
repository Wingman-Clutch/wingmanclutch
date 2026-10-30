import { existsSync, readFileSync, statSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import UKURAN from '../src/data/figur.json'
import { PROYEK } from '../src/data/proyek'
import { jalurKrayon } from '../src/engine/sketsa'
import { KOTAK_APLIKASI, KOTAK_TIM, letakFigur } from '../src/sketsa/figur'

const berkas = (nama: string) => new URL(`../public/figur/${nama}`, import.meta.url)
const IDS = PROYEK.map((p) => p.id)

describe('hasil scripts/buat-figur.mjs', () => {
  it('ada gambar diam untuk setiap aplikasi dan tim, tidak lebih dari 80 KB', () => {
    expect(Object.keys(UKURAN).sort()).toEqual([...IDS, 'tim'].sort())
    for (const id of Object.keys(UKURAN))
      expect.soft(statSync(berkas(`${id}.webp`)).size, id).toBeLessThan(80 * 1024)
  })

  it('tim hanya gambar diam; lembarnya tetap kartu nama berlanyard', () => {
    expect(existsSync(berkas('tim.html'))).toBe(false)
  })

  for (const id of IDS) {
    const html = readFileSync(berkas(`${id}.html`), 'utf8')

    it(`halaman ${id} membawa lisensi MIT engine`, () => {
      expect(html).toContain('MIT License')
      expect(html).toContain('Permission is hereby granted')
    })

    it(`halaman ${id} dikunci CSP, tidak diindeks, dan tanpa muatan dari luar`, () => {
      const csp = html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)?.[1]
      expect(csp).toContain("default-src 'none'")
      expect(csp).not.toMatch(/https?:/)
      expect(html.indexOf('Content-Security-Policy')).toBeLessThan(html.indexOf('<script'))
      expect(html).toContain('name="robots" content="noindex"')
      expect(html).not.toMatch(/<script[^>]+src=/)
      expect(html).not.toContain('Made with Colorfigures</a>')
    })
  }
})

describe('letak figur', () => {
  for (const [id, kotak] of [
    ['gorute', KOTAK_APLIKASI],
    ['postpocket', KOTAK_APLIKASI],
    ['tim', KOTAK_TIM],
  ] as const) {
    it(`${id} muat di kotaknya, menempel ke bawah, dan tidak gepeng`, () => {
      const f = letakFigur(id, kotak)
      expect(f.x).toBeGreaterThanOrEqual(kotak.x - 1e-9)
      expect(f.x + f.w).toBeLessThanOrEqual(kotak.x + kotak.w + 1e-9)
      expect(f.y).toBeGreaterThanOrEqual(kotak.y - 1e-9)
      expect(f.y + f.h).toBeCloseTo(kotak.y + kotak.h, 9)
      expect(f.w / f.h).toBeCloseTo(UKURAN[id].w / UKURAN[id].h, 9)
    })
  }
})

describe('coretan krayon', () => {
  it('selalu sama untuk benih yang sama', () => {
    expect(jalurKrayon(7)).toEqual(jalurKrayon(7))
    expect(jalurKrayon(7)).not.toEqual(jalurKrayon(8))
  })

  it('menutup seluruh kotak dengan lebar goresan 0,2', () => {
    const jalur = jalurKrayon(42)
    for (let x = 0; x <= 1; x += 0.1)
      for (let y = 0; y <= 1; y += 0.1) {
        const d = Math.min(...jalur.map(([a, b]) => Math.hypot(a - x, b - y)))
        expect.soft(d, `${x.toFixed(1)}, ${y.toFixed(1)}`).toBeLessThan(0.1)
      }
  })
})

describe('header Vercel', () => {
  const { headers } = JSON.parse(
    readFileSync(new URL('../../../vercel.json', import.meta.url), 'utf8'),
  ) as { headers: { source: string; headers: { key: string; value: string }[] }[] }

  /** nilai header yang berlaku untuk satu path */
  const nilai = (path: string, kunci: string) =>
    headers
      .filter((h) => new RegExp(`^${h.source}$`).test(path))
      .flatMap((h) => h.headers.filter((x) => x.key === kunci).map((x) => x.value))

  it('halaman biasa tidak boleh dibingkai siapa pun', () => {
    for (const path of ['/', '/index.html', '/og.jpg', '/figurkan', '/assets/index.js'])
      expect(nilai(path, 'X-Frame-Options'), path).toEqual(['DENY'])
  })

  it('halaman figur hanya boleh dibingkai halaman sendiri', () => {
    for (const id of IDS)
      expect(nilai(`/figur/${id}.html`, 'X-Frame-Options')).toEqual(['SAMEORIGIN'])
  })

  it('header keamanan lain tetap berlaku di halaman figur', () => {
    expect(nilai('/figur/gorute.html', 'X-Content-Type-Options')).toEqual(['nosniff'])
  })
})
