import { readdirSync, readFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { expect, test } from '@playwright/test'

/**
 * Target PRD bagian 2. Yang dihitung semua berkas JS di build: chunk awal, modul suara yang dimuat
 * saat browser senggang, dan chunk yang menunggu dialognya dibuka.
 */
const BATAS_GZIP = 60_000
/** halaman 404 dibangun sendiri di nyasar/, jadi anggarannya terpisah dari halaman utama */
const BATAS_NYASAR_GZIP = 40_000

/** gzip semua berkas JS di satu folder build */
function ukurFolder(folder: URL) {
  const berkas = readdirSync(folder).filter((n) => n.endsWith('.js'))
  const ukuran = berkas.map((n) => gzipSync(readFileSync(new URL(n, folder)), { level: 9 }).length)
  expect(berkas.length).toBeGreaterThan(0)
  return {
    total: ukuran.reduce((a, b) => a + b, 0),
    rincian: berkas.map((n, i) => `${n}: ${ukuran[i]}`).join(', '),
  }
}

test('semua JavaScript di build produksi muat dalam target', ({ isMobile }) => {
  test.skip(isMobile, 'ukuran build sama di semua perangkat')
  const { total, rincian } = ukurFolder(new URL('../dist/assets/', import.meta.url))
  expect(total, rincian).toBeLessThanOrEqual(BATAS_GZIP)
})

test('halaman 404 muat dalam anggarannya dan tidak ikut ke halaman utama', ({ isMobile }) => {
  test.skip(isMobile, 'ukuran build sama di semua perangkat')
  const { total, rincian } = ukurFolder(new URL('../dist/nyasar/', import.meta.url))
  expect(total, rincian).toBeLessThanOrEqual(BATAS_NYASAR_GZIP)
  const utama = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8')
  expect(utama).not.toContain('nyasar/')
})
