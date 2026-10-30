import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { bukaHalaman } from './bantu'

/** tunggu animasi yang punya akhir (dialog menempel, tema memudar); gerak diam sketsa diabaikan */
async function tungguDiam(page: Page) {
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((a) => a.effect?.getComputedTiming().iterations !== Infinity)
        .map((a) => a.finished.catch(() => {})),
    ),
  )
}

/** pelanggaran axe di seluruh halaman, atau hanya di dalam `pemilih` */
async function periksa(page: Page, pemilih?: string) {
  await tungguDiam(page)
  const axe = new AxeBuilder({ page })
  if (pemilih) axe.include(pemilih)
  const { violations } = await axe.analyze()
  return violations.map((v) => `${v.id}: ${v.help} -> ${v.nodes.map((n) => n.target).join(', ')}`)
}

test('halaman tanpa pelanggaran axe di tema terang, gelap, dan Matrix', async ({ page }) => {
  await bukaHalaman(page)
  expect(await periksa(page), 'terang').toEqual([])

  await page.getByRole('button', { name: 'Ganti ke mode gelap' }).click({ force: true })
  await expect(page.locator('html')).toHaveAttribute('data-tema', 'gelap')
  expect(await periksa(page), 'gelap').toEqual([])

  await page.locator('#sudut').click()
  await expect(page.locator('html')).toHaveAttribute('data-tema', 'matrix', { timeout: 4000 })
  await expect(page.locator('#sudut')).toBeEnabled()
  expect(await periksa(page), 'matrix').toEqual([])
})

for (const nama of ['PostPocket', 'goRute', 'Tikoem', 'Tookthel']) {
  test(`lembar ${nama} tanpa pelanggaran axe`, async ({ page }) => {
    await bukaHalaman(page)
    await page.getByRole('button', { name: new RegExp(`^${nama}:`) }).click({ force: true })
    const d = page.getByRole('dialog', { name: nama })
    // tunggu statistik dari mock supaya baris itu ikut diperiksa
    await expect(d.locator('#pr-statistik')).toContainText('★')
    expect(await periksa(page, '#dlg-proyek')).toEqual([])
  })
}

test('lembar aplikasi dan form kontak di tema gelap tanpa pelanggaran axe', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('wc-tema', 'gelap'))
  await bukaHalaman(page)
  await expect(page.locator('html')).toHaveAttribute('data-tema', 'gelap')
  await page.getByRole('button', { name: /^goRute:/ }).click({ force: true })
  await expect(page.locator('#pr-statistik')).toContainText('★')
  expect(await periksa(page, '#dlg-proyek'), 'lembar').toEqual([])
  await page.keyboard.press('Escape')

  await page.getByRole('button', { name: /Hubungi kami/ }).click({ force: true })
  const d = page.getByRole('dialog', { name: 'Hubungi Wingman Clutch' })
  await d.getByRole('button', { name: 'kirim →' }).click()
  await expect(d.getByRole('alert').first()).toContainText('Nama belum diisi')
  expect(await periksa(page, '#dlg-kontak'), 'kontak').toEqual([])
})

test('tentang, tim, dan kontak tanpa pelanggaran axe', async ({ page }) => {
  await bukaHalaman(page)
  await page.getByRole('button', { name: 'Tentang kami' }).click({ force: true })
  await expect(page.getByRole('dialog', { name: 'Tentang kami' })).toBeVisible()
  expect(await periksa(page, '#dlg-tentang'), 'tentang').toEqual([])

  await page.getByRole('button', { name: 'kenalan sama tim →' }).click()
  await expect(page.getByRole('dialog', { name: 'Tim kami' })).toBeVisible()
  expect(await periksa(page, '#dlg-tim'), 'tim').toEqual([])

  await page.getByRole('button', { name: 'ajak kerja bareng →' }).click()
  await expect(page.getByRole('dialog', { name: 'Hubungi Wingman Clutch' })).toBeVisible()
  expect(await periksa(page, '#dlg-kontak'), 'kontak').toEqual([])
})

test('form kontak tanpa pelanggaran axe saat galat, cadangan email, dan terkirim', async ({
  page,
}) => {
  await bukaHalaman(page)
  await page.getByRole('button', { name: /Hubungi kami/ }).click({ force: true })
  const d = page.getByRole('dialog', { name: 'Hubungi Wingman Clutch' })
  await d.getByRole('button', { name: 'kirim →' }).click()
  await expect(d.getByRole('alert').first()).toContainText('Nama belum diisi')
  expect(await periksa(page, '#dlg-kontak'), 'galat kolom').toEqual([])

  await d.getByLabel('nama kamu').fill('Sari')
  await d.getByLabel('email kamu').fill('sari@contoh.com')
  await d.getByLabel('mau bikin apa?').fill('Tolong cek pesan ini #gagal')
  await d.getByRole('button', { name: 'kirim →' }).click()
  await expect(d.getByRole('link', { name: 'buka email →' })).toBeVisible()
  expect(await periksa(page, '#dlg-kontak'), 'cadangan email').toEqual([])

  await d.getByLabel('mau bikin apa?').fill('Mau bikin aplikasi kasir buat warung kopi.')
  await d.getByRole('button', { name: 'kirim →' }).click()
  await expect(d.getByRole('status')).toContainText('Terkirim!')
  expect(await periksa(page, '#dlg-kontak'), 'terkirim').toEqual([])
})
