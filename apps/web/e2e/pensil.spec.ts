import { expect, test } from '@playwright/test'
import { bukaHalaman, pikselTinta } from './bantu'

test('pensil mencoret halaman, penghapus membersihkan lalu menggambar ulang', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'menarik garis dengan mouse hanya di desktop')
  await bukaHalaman(page)
  await page.getByRole('button', { name: 'Corat-coret pakai pensil biru' }).click()
  await expect(page.getByRole('button', { name: 'Corat-coret pakai pensil biru' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(page.locator('#bar-coret')).toBeVisible()
  await page.mouse.move(300, 830)
  await page.mouse.down()
  for (let i = 0; i < 30; i++) await page.mouse.move(300 + i * 15, 830 + Math.sin(i / 3) * 25)
  await page.mouse.up()
  expect(await pikselTinta(page, '#coretan')).toBeGreaterThan(1000)
  await page.keyboard.press('Escape')
  await expect(page.locator('#bar-coret')).toBeHidden()

  await page.getByRole('button', { name: 'Hapus halaman lalu gambar ulang' }).click()
  // setelah penghapus lewat, coretan hilang dan sketsa digambar ulang dari awal
  await expect.poll(() => pikselTinta(page, '#coretan'), { timeout: 8000 }).toBe(0)
  await expect(page.locator('[data-sketsa="kontak"]')).toHaveClass(/selesai/, { timeout: 10_000 })
  expect(await pikselTinta(page, '[data-sketsa="logo"] canvas')).toBeGreaterThan(500)
})

test('gerak dikurangi: semua sketsa langsung tergambar', async ({ browser }) => {
  const konteks = await browser.newContext({ reducedMotion: 'reduce' })
  const page = await konteks.newPage()
  await page.goto('/')
  await expect(page.locator('[data-sketsa="kontak"]')).toHaveClass(/selesai/, { timeout: 1500 })
  expect(await pikselTinta(page, '[data-sketsa="postpocket"] canvas')).toBeGreaterThan(500)
  await konteks.close()
})
