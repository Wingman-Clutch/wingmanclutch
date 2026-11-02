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
  // kelas `selesai` lama masih menempel sesaat sebelum halaman digambar ulang, jadi tunggu tintanya
  await expect
    .poll(() => pikselTinta(page, '[data-sketsa="merek"] canvas'), { timeout: 10_000 })
    .toBeGreaterThan(500)
  await expect
    .poll(() => pikselTinta(page, '[data-sketsa="gorute"] canvas.figur'))
    .toBeGreaterThan(2000)
  await expect(page.locator('[data-sketsa="kontak"]')).toHaveClass(/selesai/, { timeout: 10_000 })
})

test('saat mencoret, pensil lain, tali lampu, dan penghapus tetap bisa langsung diketuk', async ({
  page,
}) => {
  await bukaHalaman(page)
  const pensil = (warna: string) =>
    page.getByRole('button', { name: `Corat-coret pakai pensil ${warna}` })
  const nama = page.locator('.nama-pensil')
  await pensil('grafit').click()
  await expect(nama).toHaveText('pensil grafit')

  // ketukan di pensil lain mengganti pensil, bukan mencoret
  await pensil('merah').click()
  await expect(pensil('merah')).toHaveAttribute('aria-pressed', 'true')
  await expect(pensil('grafit')).toHaveAttribute('aria-pressed', 'false')
  await expect(nama).toHaveText('pensil merah')
  expect(await pikselTinta(page, '#coretan')).toBe(0)

  // ketukan di pensil yang sedang dipegang meletakkannya
  await pensil('merah').click()
  await expect(page.locator('#bar-coret')).toBeHidden()
  await pensil('merah').click()
  await expect(page.locator('#bar-coret')).toBeVisible()

  // tema berganti di tengah mencoret: nama pensil ikut warna tinta tema baru
  const warnaTerang = await nama.evaluate((el) => el.style.color)
  await page.getByRole('button', { name: 'Matikan lampu' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-tema', 'gelap')
  await expect(page.locator('#bar-coret')).toBeVisible()
  expect(await nama.evaluate((el) => el.style.color)).not.toBe(warnaTerang)

  // penghapus meletakkan pensil sekalian menghapus halaman
  await page.getByRole('button', { name: 'Hapus halaman lalu gambar ulang' }).click()
  await expect(page.locator('#bar-coret')).toBeHidden()
  await expect(pensil('merah')).toHaveAttribute('aria-pressed', 'false')
})

test('goresan yang melintasi pensil tetap goresan, tidak mengganti pensil', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'menarik garis dengan mouse hanya di desktop')
  await bukaHalaman(page)
  const pensil = (warna: string) =>
    page.getByRole('button', { name: `Corat-coret pakai pensil ${warna}` })
  await pensil('grafit').click()
  const k = (await pensil('merah').boundingBox())!
  const x = k.x + k.width / 2
  const y = k.y - 40
  // mulai di kertas kosong tepat di atas pensil merah, lalu turun melintasinya
  expect(await page.evaluate(([a, b]) => document.elementFromPoint(a, b)?.id, [x, y])).toBe(
    'coretan',
  )
  await page.mouse.move(x, y)
  await page.mouse.down()
  for (let i = 1; i <= 20; i++) await page.mouse.move(x, y + (i * (k.height + 40)) / 20)
  await page.mouse.up()
  expect(await pikselTinta(page, '#coretan')).toBeGreaterThan(200)
  await expect(pensil('grafit')).toHaveAttribute('aria-pressed', 'true')
  await expect(pensil('merah')).toHaveAttribute('aria-pressed', 'false')
})

test('gerak dikurangi: semua sketsa langsung tergambar', async ({ browser }) => {
  const konteks = await browser.newContext({ reducedMotion: 'reduce' })
  const page = await konteks.newPage()
  await page.goto('/')
  // tanpa layar pembuka dan tanpa animasi menggambar
  await expect(page.locator('#pembuka')).toBeHidden()
  await expect(page.locator('[data-sketsa="kontak"]')).toHaveClass(/selesai/, { timeout: 1500 })
  expect(await pikselTinta(page, '[data-sketsa="postpocket"] canvas:not(.figur)')).toBeGreaterThan(
    500,
  )
  await expect
    .poll(() => pikselTinta(page, '[data-sketsa="postpocket"] canvas.figur'))
    .toBeGreaterThan(2000)
  await konteks.close()
})
