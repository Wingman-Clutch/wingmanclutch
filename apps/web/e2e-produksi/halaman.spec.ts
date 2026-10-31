import { expect, test } from '@playwright/test'
import { bukaHalaman, bukaLembar } from '../e2e/bantu'
import { PROYEK } from '../src/data/proyek'

test('halaman produksi terbuka dan lembar keempat aplikasi menampilkan statistik asli', async ({
  page,
}) => {
  const galat = await bukaHalaman(page)
  // statistik diambil sekali, saat lembar pertama dibuka
  const statistik = page.waitForResponse((r) => new URL(r.url()).pathname === '/api/proyek')
  for (const p of PROYEK) {
    const { d } = await bukaLembar(page, p.nama)
    await expect(d.locator('#pr-statistik')).toHaveText(/^★ \d+ · diperbarui /)
    await page.keyboard.press('Escape')
    await expect(d).toBeHidden()
  }
  expect((await statistik).status()).toBe(200)
  expect(galat).toEqual([])
})
