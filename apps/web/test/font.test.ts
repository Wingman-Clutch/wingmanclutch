import { readFileSync } from 'node:fs'
import { expect, it, vi } from 'vitest'
import font from '../src/data/font.json'
import { TIM } from '../src/data/proyek'
import { judul, tulis } from '../src/engine/huruf'
import { daftarDef } from '../src/halaman/papan'
import { teksTanggal } from '../src/sketsa/catatan'

const terpakai = vi.hoisted(() => ({ tangan: new Set<string>(), judul: new Set<string>() }))

// catat setiap teks yang masuk ke mesin pensil, lalu teruskan ke fungsi aslinya
vi.mock('../src/engine/huruf', async (asli) => {
  const m = await asli<typeof import('../src/engine/huruf')>()
  return {
    ...m,
    tulis: (...a: Parameters<typeof m.tulis>) => {
      for (const k of a[0]) terpakai.tangan.add(k)
      return m.tulis(...a)
    },
    judul: (...a: Parameters<typeof m.judul>) => {
      for (const k of a[0].toUpperCase()) terpakai.judul.add(k)
      return m.judul(...a)
    },
  }
})

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8')

it('semua teks di halaman punya glyph di data font', () => {
  // semua sketsa di halaman, termasuk nama aplikasi
  for (const d of daftarDef()) d.ops()
  // tanggal berganti setiap hari, jadi ambil semua angka dan semua nama bulan
  tulis('0123456789', 0, 0, 28)
  for (let bulan = 0; bulan < 12; bulan++) tulis(teksTanggal(new Date(2026, bulan, 1)), 0, 0, 28)
  // judul dialog dan kartu nama tim baru digambar saat dialognya dibuka
  for (const [, teks] of html.matchAll(/data-judul="([^"]+)"/g)) judul(teks, 0, 46, 46)
  for (const a of TIM) judul(`${a.panggilan} ${a.panggilan[0]}`, 0, 46, 46)

  expect(terpakai.judul.size).toBeGreaterThan(10)
  const saran = (nama: string) =>
    `tambahkan ke ${nama} di scripts/buat-font.mjs, lalu jalankan pnpm --filter @wingmanclutch/web font`
  expect(
    [...terpakai.tangan].filter((k) => !(k in font.tangan)),
    saran('KARAKTER_TANGAN'),
  ).toEqual([])
  expect(
    [...terpakai.judul].filter((k) => !(k in font.judul)),
    saran('KARAKTER_JUDUL'),
  ).toEqual([])
})

it('glyph cadangan untuk karakter yang tidak dikenal ada di kedua font', () => {
  expect('?' in font.tangan && '?' in font.judul).toBe(true)
})
