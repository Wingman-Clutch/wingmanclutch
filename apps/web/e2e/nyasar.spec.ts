import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { pikselTinta } from './bantu'

const STIKER = '#stiker canvas'
const ANGKA = '[data-sketsa="angka"] canvas'

/** buka halaman 404 dan tunggu tulisan pensil dan stikernya tampil */
async function bukaNyasar(page: Page) {
  const galat: string[] = []
  page.on('pageerror', (e) => galat.push(e.message))
  page.on('console', (m) => {
    if (m.type() === 'error') galat.push(m.text())
  })
  await page.goto('/404.html')
  await expect(page.locator('[data-sketsa="keterangan"]')).toHaveClass(/selesai/, {
    timeout: 8000,
  })
  await expect.poll(() => pikselTinta(page, STIKER)).toBeGreaterThan(1000)
  return galat
}

test('halaman 404 tampil utuh tanpa galat, tanpa scroll, lalu kembali ke halaman utama', async ({
  page,
}) => {
  const galat = await bukaNyasar(page)
  await expect(page).toHaveTitle(/Halaman tidak ditemukan/)
  await expect(page.getByRole('heading', { name: 'Halaman tidak ditemukan' })).toBeAttached()
  expect(await pikselTinta(page, ANGKA)).toBeGreaterThan(5000)
  expect(
    await page.evaluate(() => {
      const a = document.documentElement
      return a.scrollWidth <= innerWidth && a.scrollHeight <= innerHeight
    }),
  ).toBe(true)
  await page.getByRole('link', { name: /balik ke halaman utama/ }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Wingman Clutch')
  expect(galat).toEqual([])
})

test('setiap ketukan di stiker menggosok angkanya sedikit lagi, sampai batasnya', async ({
  page,
}) => {
  await bukaNyasar(page)
  const stiker = page.getByRole('button', { name: /Ketuk buat menggosok lagi/ })
  await expect
    .poll(() => pikselTinta(page, ANGKA), { timeout: 4000 })
    .toBeLessThan(await pikselTinta(page, ANGKA))
  let tinta = 0
  for (let i = 0; i < 2; i++) {
    tinta = await pikselTinta(page, ANGKA)
    await stiker.click({ force: true })
    await expect.poll(() => pikselTinta(page, ANGKA), { timeout: 4000 }).toBeLessThan(tinta)
  }
  // gosokan tidak menghabiskan semuanya: dua angka pertama tetap utuh
  expect(await pikselTinta(page, ANGKA)).toBeGreaterThan(tinta * 0.5)
})

test('ukuran layar berubah: gosokan tetap ada', async ({ page, isMobile }) => {
  test.skip(isMobile, 'mengubah ukuran jendela hanya di desktop')
  await bukaNyasar(page)
  await page.waitForTimeout(1200)
  const sebelum = await pikselTinta(page, ANGKA)
  const stiker = page.locator('#stiker')
  await stiker.click({ force: true })
  await expect.poll(() => pikselTinta(page, ANGKA), { timeout: 4000 }).toBeLessThan(sebelum)
  await page.waitForTimeout(600)
  const tergosok = await pikselTinta(page, ANGKA)
  await page.setViewportSize({ width: 1440, height: 899 })
  await expect.poll(() => pikselTinta(page, ANGKA)).toBeLessThan(sebelum)
  expect(await pikselTinta(page, ANGKA)).toBeLessThan(tergosok * 1.05)
})

test('gerak dikurangi: semuanya langsung tampil', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce' })
  const page = await ctx.newPage()
  await page.goto('/404.html')
  await expect(page.locator('[data-sketsa="keterangan"]')).toHaveClass(/selesai/, {
    timeout: 1500,
  })
  await expect.poll(() => pikselTinta(page, STIKER)).toBeGreaterThan(1000)
  await ctx.close()
})

for (const colorScheme of ['light', 'dark'] as const) {
  test(`axe 0 pelanggaran di tema ${colorScheme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme })
    await bukaNyasar(page)
    const { violations } = await new AxeBuilder({ page }).analyze()
    expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(', ')}`)).toEqual([])
  })
}
