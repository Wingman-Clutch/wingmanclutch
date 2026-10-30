// Gambar README (docs/gambar/*.webp) dan gambar OG (public/og.jpg) dari build produksi.
// Gambar OG dijaga di bawah 300 KB supaya pratinjau WhatsApp tetap muncul.
// Jalankan setelah tampilan berubah: pnpm build && node apps/web/scripts/buat-gambar.mjs
//
// Memakai vite preview dengan mock API (statistik ikut tampil) dan Chromium dari Playwright.

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

process.env.MOCK_API = '1'
const akar = dirname(dirname(fileURLToPath(import.meta.url)))
const { preview } = await import('vite')
const server = await preview({ root: akar, preview: { port: 4190, strictPort: true } })
const url = 'http://localhost:4190/'
const keluar = join(akar, '../../docs/gambar')
mkdirSync(keluar, { recursive: true })

const browser = await chromium.launch()

/** PNG dari Playwright diubah ke WebP lewat canvas Chromium */
async function keWebp(png, kualitas = 0.86) {
  const p = await browser.newPage()
  const data = await p.evaluate(
    async ([b64, q]) => {
      const img = new Image()
      img.src = 'data:image/png;base64,' + b64
      await img.decode()
      const c = document.createElement('canvas')
      c.width = img.naturalWidth
      c.height = img.naturalHeight
      c.getContext('2d').drawImage(img, 0, 0)
      return c.toDataURL('image/webp', q).split(',')[1]
    },
    [png.toString('base64'), kualitas],
  )
  await p.close()
  return Buffer.from(data, 'base64')
}

async function halaman(opsi) {
  const p = await browser.newPage(opsi)
  await p.goto(url, { waitUntil: 'networkidle' })
  // tunggu semua sketsa selesai dan layar perangkat sempat tergambar
  await p.waitForTimeout(5200)
  return p
}

async function simpan(p, nama) {
  writeFileSync(join(keluar, nama), await keWebp(await p.screenshot()))
  console.log('docs/gambar/' + nama)
}

const desktop = { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1.5 }
const hp = {
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
}

for (const tema of ['light', 'dark']) {
  const p = await halaman({ ...desktop, colorScheme: tema })
  await simpan(p, `halaman-${tema === 'light' ? 'terang' : 'gelap'}.webp`)
  await p.close()
}

{
  const p = await halaman({ ...hp, colorScheme: 'light' })
  await simpan(p, 'hp-1-halaman.webp')
  await p.getByRole('button', { name: /^goRute:/ }).click({ force: true })
  await p.waitForTimeout(900)
  await simpan(p, 'hp-2-detail.webp')
  await p.keyboard.press('Escape')
  await p.getByRole('button', { name: /Kenalan sama tim/ }).click({ force: true })
  // kartu nama berlanyard dimuat lalu masuk sambil berayun; tunggu sampai tenang
  await p.getByRole('button', { name: /^Kartu nama Kall/ }).waitFor()
  await p.waitForTimeout(3500)
  await simpan(p, 'hp-3-tim.webp')
  await p.keyboard.press('Escape')
  await p.getByRole('button', { name: /Hubungi kami/ }).click({ force: true })
  await p.waitForTimeout(900)
  await simpan(p, 'hp-4-kontak.webp')
  await p.close()
}

{
  const p = await halaman({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
    colorScheme: 'light',
  })
  writeFileSync(join(akar, 'public/og.jpg'), await p.screenshot({ type: 'jpeg', quality: 62 }))
  console.log('apps/web/public/og.jpg')
  await p.close()
}

await browser.close()
await new Promise((ok) => server.httpServer.close(ok))
