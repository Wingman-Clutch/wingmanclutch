import { expect, test } from '@playwright/test'
import { bukaHalaman, pikselTinta } from './bantu'

const APLIKASI = [
  {
    id: 'postpocket',
    nama: 'PostPocket',
    url: 'https://postpocket.vercel.app',
    repo: 'PostPocket',
  },
  { id: 'gorute', nama: 'goRute', url: 'https://gorute.vercel.app', repo: 'goRute' },
  { id: 'tikoem', nama: 'Tikoem', url: 'https://tikoem.vercel.app', repo: 'tikoem' },
  { id: 'tookthel', nama: 'Tookthel', url: 'https://tookthel.vercel.app', repo: 'tookthel' },
]

test('halaman terbuka tanpa galat dan semua sketsa tergambar', async ({ page }) => {
  const galat = await bukaHalaman(page)
  for (const id of [
    'logo',
    'postpocket',
    'gorute',
    'tikoem',
    'tookthel',
    'tentang',
    'tim',
    'kontak',
  ]) {
    expect.soft(await pikselTinta(page, `[data-sketsa="${id}"] canvas`), id).toBeGreaterThan(500)
  }
  await expect(page.locator('.pensil')).toHaveCount(5)
  await expect(page.getByRole('button', { name: 'Hapus halaman lalu gambar ulang' })).toBeVisible()
  expect(galat).toEqual([])
})

test('halaman muat di layar tanpa scroll dan keempat aplikasi terlihat', async ({ page }) => {
  await bukaHalaman(page)
  const ukuran = await page.evaluate(() => ({
    lebar: document.documentElement.scrollWidth,
    tinggi: document.documentElement.scrollHeight,
    vw: innerWidth,
    vh: innerHeight,
  }))
  expect(ukuran.lebar).toBeLessThanOrEqual(ukuran.vw)
  expect(ukuran.tinggi).toBeLessThanOrEqual(ukuran.vh)
  for (const a of APLIKASI) {
    const b = (await page.locator(`[data-sketsa="${a.id}"]`).boundingBox())!
    expect.soft(b.x, a.id).toBeGreaterThanOrEqual(-8)
    expect.soft(b.x + b.width, a.id).toBeLessThanOrEqual(ukuran.vw + 8)
    expect.soft(b.y + b.height, a.id).toBeLessThanOrEqual(ukuran.vh)
  }
})

for (const a of APLIKASI) {
  test(`sketsa ${a.nama} membuka lembar detailnya`, async ({ page }) => {
    await bukaHalaman(page)
    const tombol = page.getByRole('button', { name: new RegExp(`^${a.nama}:`) })
    await tombol.click({ force: true })
    const d = page.getByRole('dialog', { name: a.nama })
    await expect(d).toBeVisible()
    await expect(d.getByRole('link', { name: 'buka aplikasinya →' })).toHaveAttribute('href', a.url)
    await expect(d.getByRole('link', { name: 'lihat kodenya →' })).toHaveAttribute(
      'href',
      `https://github.com/Wingman-Clutch/${a.repo}`,
    )
    await expect(d.locator('#pr-fitur li')).toHaveCount(3)
    expect(await pikselTinta(page, '#pr-fitur canvas')).toBeGreaterThan(500)
    // statistik dari /api/proyek (mock)
    await expect(d.locator('#pr-statistik')).toContainText('★')
    await page.keyboard.press('Escape')
    await expect(d).toBeHidden()
    await expect(tombol).toBeFocused()
  })
}

test('tentang kami, lalu tim, lalu kontak', async ({ page }) => {
  await bukaHalaman(page)
  await page.getByRole('button', { name: 'Tentang kami' }).click({ force: true })
  const tentang = page.getByRole('dialog', { name: 'Tentang kami' })
  await expect(tentang).toContainText('tim dua orang')
  await tentang.getByRole('button', { name: 'kenalan sama tim →' }).click()
  const tim = page.getByRole('dialog', { name: 'Tim kami' })
  await expect(tim).toBeVisible()
  await expect(tim.getByRole('link', { name: 'Kall' })).toHaveAttribute(
    'href',
    'https://github.com/HaikalFaruq',
  )
  await expect(tim.getByRole('link', { name: 'Bintang' })).toHaveAttribute(
    'href',
    'https://github.com/bintangfabian',
  )
  await expect.poll(() => pikselTinta(page, '#tm-daftar canvas.foto')).toBeGreaterThan(10_000)
  await tim.getByRole('button', { name: 'ajak kerja bareng →' }).click()
  await expect(page.getByRole('dialog', { name: 'Hubungi Wingman Clutch' })).toBeVisible()
})

test('form kontak: cek kolom, terkirim, lalu cadangan email saat backend gagal', async ({
  page,
}) => {
  await bukaHalaman(page)
  await page.getByRole('button', { name: /Hubungi kami/ }).click({ force: true })
  const d = page.getByRole('dialog', { name: 'Hubungi Wingman Clutch' })
  await d.getByRole('button', { name: 'kirim →' }).click()
  await expect(d.getByRole('alert').first()).toContainText('Nama belum diisi')
  await expect(d.getByLabel('nama kamu')).toHaveAttribute('aria-invalid', 'true')
  await expect(d.getByLabel('nama kamu')).toBeFocused()

  await d.getByLabel('nama kamu').fill('Sari')
  await d.getByLabel('email kamu').fill('sari@contoh.com')
  await d.getByLabel('mau bikin apa?').fill('Mau bikin aplikasi kasir buat warung kopi.')
  await d.getByRole('button', { name: 'kirim →' }).click()
  await expect(d.getByRole('status')).toContainText('Terkirim!')
  await page.keyboard.press('Escape')

  await page.getByRole('button', { name: /Hubungi kami/ }).click({ force: true })
  await expect(d.getByRole('button', { name: 'kirim →' })).toBeVisible()
  await d.getByLabel('nama kamu').fill('Sari')
  await d.getByLabel('email kamu').fill('sari@contoh.com')
  await d.getByLabel('mau bikin apa?').fill('Tolong cek pesan ini #gagal')
  await d.getByRole('button', { name: 'kirim →' }).click()
  const surel = d.getByRole('link', { name: 'buka email →' })
  await expect(surel).toBeVisible()
  const href = (await surel.getAttribute('href'))!
  expect(href.startsWith('mailto:wingmanclutch@gmail.com?')).toBe(true)
  expect(decodeURIComponent(href)).toContain('Tolong cek pesan ini #gagal')
  expect(decodeURIComponent(href)).toContain('Sari (sari@contoh.com)')
})

test('tema gelap tersimpan setelah halaman dibuka lagi', async ({ page }) => {
  await bukaHalaman(page)
  await expect(page.locator('html')).toHaveAttribute('data-tema', 'terang')
  await page.getByRole('button', { name: 'Ganti ke mode gelap' }).click({ force: true })
  await expect(page.locator('html')).toHaveAttribute('data-tema', 'gelap')
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-tema', 'gelap')
  await expect(page.getByRole('button', { name: 'Ganti ke mode terang' })).toBeVisible()
})

test('sudut halaman dikupas ke Matrix lalu kembali', async ({ page }) => {
  await bukaHalaman(page)
  await page.locator('#sudut').click()
  await expect(page.locator('html')).toHaveAttribute('data-tema', 'matrix', { timeout: 4000 })
  await expect(page.locator('#sudut')).toBeEnabled()
  await page.waitForTimeout(700)
  await page.locator('#sudut').click()
  await expect(page.locator('html')).toHaveAttribute('data-tema', 'terang', { timeout: 4000 })
})

test('logo diketuk mengepakkan sayap', async ({ page }) => {
  await bukaHalaman(page)
  const sebelum = await pikselTinta(page, '[data-sketsa="kepak1"] canvas')
  expect(sebelum).toBe(0)
  await page.getByRole('button', { name: /Ketuk logonya/ }).click({ force: true })
  await expect.poll(() => pikselTinta(page, '[data-sketsa="kepak1"] canvas')).toBeGreaterThan(100)
})

test('keyboard: Enter membuka sketsa, Escape mengembalikan fokus', async ({ page }) => {
  await bukaHalaman(page)
  const tombol = page.getByRole('button', { name: /^Tikoem:/ })
  await tombol.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('dialog', { name: 'Tikoem' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(tombol).toBeFocused()
})
