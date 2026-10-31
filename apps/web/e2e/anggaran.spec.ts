import { readdirSync, readFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { expect, test } from '@playwright/test'

/**
 * Target PRD bagian 2. Yang dihitung semua berkas JS di build: chunk awal, modul suara yang dimuat
 * saat browser senggang, dan chunk yang menunggu dialognya dibuka.
 */
const BATAS_GZIP = 60_000

test('semua JavaScript di build produksi muat dalam target', ({ isMobile }) => {
  test.skip(isMobile, 'ukuran build sama di semua perangkat')
  const folder = new URL('../dist/assets/', import.meta.url)
  const berkas = readdirSync(folder).filter((n) => n.endsWith('.js'))
  const ukuran = berkas.map((n) => gzipSync(readFileSync(new URL(n, folder)), { level: 9 }).length)
  expect(berkas.length).toBeGreaterThan(0)
  const rincian = berkas.map((n, i) => `${n}: ${ukuran[i]}`).join(', ')
  expect(
    ukuran.reduce((a, b) => a + b, 0),
    rincian,
  ).toBeLessThanOrEqual(BATAS_GZIP)
})
