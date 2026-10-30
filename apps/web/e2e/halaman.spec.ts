import { expect, test } from '@playwright/test'
import { bukaHalaman, bukaLembar, pikselTinta } from './bantu'

const APLIKASI = [
  {
    id: 'postpocket',
    nama: 'PostPocket',
    url: 'https://postpocket.vercel.app',
    repo: 'PostPocket',
    tombol: 'Buka amplop',
  },
  {
    id: 'gorute',
    nama: 'goRute',
    url: 'https://gorute.vercel.app',
    repo: 'goRute',
    tombol: 'Cari rute',
  },
  {
    id: 'tikoem',
    nama: 'Tikoem',
    url: 'https://tikoem.vercel.app',
    repo: 'tikoem',
    tombol: 'Tambah teman',
  },
  {
    id: 'tookthel',
    nama: 'Tookthel',
    url: 'https://tookthel.vercel.app',
    repo: 'tookthel',
    tombol: 'Cetak struk',
  },
]

test('halaman terbuka tanpa galat dan semua sketsa tergambar', async ({ page }) => {
  const galat = await bukaHalaman(page)
  for (const id of [
    'merek',
    'postpocket',
    'gorute',
    'tikoem',
    'tookthel',
    'tentang',
    'tim',
    'kontak',
  ]) {
    const goresan = `[data-sketsa="${id}"] canvas:not(.figur)`
    expect.soft(await pikselTinta(page, goresan), id).toBeGreaterThan(500)
  }
  for (const id of [...APLIKASI.map((a) => a.id), 'tim', 'logo'])
    await expect
      .poll(() => pikselTinta(page, `[data-sketsa="${id}"] canvas.figur`), `figur ${id}`)
      .toBeGreaterThan(2000)
  // mug kopi hanya ada di tata letak lanskap
  if (await page.locator('[data-sketsa="kopi"]').isVisible())
    await expect
      .poll(() => pikselTinta(page, '[data-sketsa="kopi"] canvas.figur'), 'figur kopi')
      .toBeGreaterThan(500)
  await expect(page.locator('#lampu img.nyala')).toHaveJSProperty('complete', true)
  await expect(page.getByRole('button', { name: 'Matikan lampu' })).toBeVisible()
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
    const { d, figur } = await bukaLembar(page, a.nama)
    await expect(figur.getByRole('img', { name: a.nama })).toBeVisible()
    await expect(d.getByRole('link', { name: 'buka aplikasinya →' })).toHaveAttribute('href', a.url)
    await expect(d.getByRole('link', { name: 'lihat kodenya →' })).toHaveAttribute(
      'href',
      `https://github.com/Wingman-Clutch/${a.repo}`,
    )
    await expect(d.locator('#pr-fitur li')).toHaveCount(3)
    // statistik dari /api/proyek (mock)
    await expect(d.locator('#pr-statistik')).toContainText('★')
    await page.keyboard.press('Escape')
    await expect(d).toBeHidden()
    await expect(tombol).toBeFocused()
    // iframe dibuang supaya figurnya tidak jalan terus di belakang
    await expect(page.locator('#pr-figur iframe')).toHaveCount(0)
  })

  test(`figur ${a.nama}: tombolnya mengubah gambar dan Escape menutup lembar`, async ({ page }) => {
    await bukaHalaman(page)
    const { d, figur } = await bukaLembar(page, a.nama)
    const gambar = () => figur.locator('#art').innerHTML()
    const awal = await gambar()
    // fokus pindah ke dalam iframe, jadi Escape harus tetap sampai ke dialog di halaman induk
    await figur.getByRole('button', { name: a.tombol }).click()
    await expect.poll(gambar).not.toBe(awal)
    await page.keyboard.press('Escape')
    await expect(d).toBeHidden()
  })
}

test('figur diputar dengan seret dan tidak menambah riwayat browser', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'menyeret dengan mouse hanya di desktop')
  await bukaHalaman(page)
  const riwayat = await page.evaluate(() => history.length)
  const { figur } = await bukaLembar(page, 'goRute')
  const gambar = () => figur.locator('#art').innerHTML()
  const awal = await gambar()
  const b = (await figur.locator('#fig').boundingBox())!
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2)
  await page.mouse.down()
  await page.mouse.move(b.x + b.width / 2 + 120, b.y + b.height / 2, { steps: 6 })
  await page.mouse.up()
  await expect.poll(gambar).not.toBe(awal)
  await page.keyboard.press('Escape')
  await bukaLembar(page, 'Tikoem')
  await page.keyboard.press('Escape')
  expect(await page.evaluate(() => history.length)).toBe(riwayat)
})

test('figur mengikuti tema gelap, termasuk saat tema sistem berganti', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' })
  await bukaHalaman(page)
  const { figur } = await bukaLembar(page, 'Tookthel')
  await expect(figur.locator('html')).toHaveAttribute('data-tema', 'gelap')
  await page.emulateMedia({ colorScheme: 'light' })
  await expect(figur.locator('html')).toHaveAttribute('data-tema', 'terang')
})

test('figur gagal dimuat: gambar diamnya tetap tampil', async ({ page }) => {
  await page.route(/\/figur\/\w+\.html/, (r) => r.abort())
  await bukaHalaman(page)
  await page.getByRole('button', { name: /^goRute:/ }).click({ force: true })
  const panggung = page.locator('#pr-figur')
  await expect(panggung.locator('img')).toBeVisible()
  await expect(panggung.locator('img')).toHaveJSProperty('complete', true)
  await expect(panggung).not.toHaveClass(/siap/)
})

test('tentang kami, lalu tim, lalu kontak', async ({ page }) => {
  await bukaHalaman(page)
  await page.getByRole('button', { name: 'Tentang kami' }).click({ force: true })
  const tentang = page.getByRole('dialog', { name: 'Tentang kami' })
  await expect(tentang).toContainText('Kall dan Bintang')
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
  await expect.poll(() => pikselTinta(page, '#tm-daftar canvas.tali')).toBeGreaterThan(5_000)
  await tim.getByRole('button', { name: 'ajak kerja bareng →' }).click()
  await expect(page.getByRole('dialog', { name: 'Hubungi Wingman Clutch' })).toBeVisible()
})

test('kartu nama tim: dibalik dengan Enter atau ketukan, diseret tanpa terbalik', async ({
  page,
}) => {
  // gerak dikurangi: kartu langsung tergantung diam tanpa ayunan masuk, jadi bisa dipegang
  // di titik yang pasti
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const galat = await bukaHalaman(page)
  await page.getByRole('button', { name: /^Tim kami/ }).click({ force: true })
  const tim = page.getByRole('dialog', { name: 'Tim kami' })
  const kall = tim.getByRole('button', { name: /^Kartu nama Kall/ })
  const bintang = tim.getByRole('button', { name: /^Kartu nama Bintang/ })
  // modul lanyard dimuat saat dialog pertama kali dibuka; kartu terlihat setelah tergantung
  await expect(kall).toBeVisible()
  await expect(kall).toHaveAttribute('aria-pressed', 'false')
  await expect(bintang).toHaveAttribute('aria-pressed', 'false')

  await kall.focus()
  await page.keyboard.press('Enter')
  await expect(kall).toHaveAttribute('aria-pressed', 'true')
  await page.keyboard.press(' ')
  await expect(kall).toHaveAttribute('aria-pressed', 'false')

  // ketukan tanpa geser membalik kartu
  const k = (await bintang.boundingBox())!
  await page.mouse.click(k.x + k.width / 2, k.y + k.height * 0.7)
  await expect(bintang).toHaveAttribute('aria-pressed', 'true')

  // diseret: titik gantung kartu ikut pindah (kotaknya bisa miring), dan kartu tidak terbalik
  const gantung = () =>
    kall.evaluate((b) => parseFloat(b.closest<HTMLElement>('.badge')!.style.transform.slice(12)))
  const awal = (await kall.boundingBox())!
  const x0 = await gantung()
  await page.mouse.move(awal.x + awal.width / 2, awal.y + awal.height * 0.6)
  await page.mouse.down()
  await page.mouse.move(awal.x + awal.width / 2 + 60, awal.y + awal.height * 0.6 + 30, {
    steps: 8,
  })
  await expect.poll(gantung).toBeGreaterThan(x0 + 40)
  await page.mouse.up()
  await expect(kall).toHaveAttribute('aria-pressed', 'false')

  // lanyard berhenti saat dialog ditutup dan jalan lagi saat dibuka
  await page.keyboard.press('Escape')
  await expect(tim).toBeHidden()
  await page.getByRole('button', { name: /^Tim kami/ }).click({ force: true })
  await expect(bintang).toHaveAttribute('aria-pressed', 'true')
  await expect.poll(() => pikselTinta(page, '#tm-daftar canvas.tali')).toBeGreaterThan(5_000)
  expect(galat).toEqual([])
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
  await d.getByLabel('pesan kamu').fill('Mau bikin aplikasi kasir buat warung kopi.')
  await d.getByRole('button', { name: 'kirim →' }).click()
  await expect(d.getByRole('status')).toContainText('Pesannya sudah sampai')
  await page.keyboard.press('Escape')

  await page.getByRole('button', { name: /Hubungi kami/ }).click({ force: true })
  await expect(d.getByRole('button', { name: 'kirim →' })).toBeVisible()
  await d.getByLabel('nama kamu').fill('Sari')
  await d.getByLabel('email kamu').fill('sari@contoh.com')
  await d.getByLabel('pesan kamu').fill('Tolong cek pesan ini #gagal')
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
  await page.getByRole('button', { name: 'Matikan lampu' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-tema', 'gelap')
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-tema', 'gelap')
  await expect(page.getByRole('button', { name: 'Nyalakan lampu' })).toBeVisible()
  await expect(page.locator('#lampu img.mati')).toBeVisible()
})

test('tali lampu: klik, Enter, dan tarikan mematikan atau menyalakan lampu', async ({
  page,
  isMobile,
}) => {
  await bukaHalaman(page)
  const html = page.locator('html')
  await expect(html).toHaveAttribute('data-tema', 'terang')
  await page.getByRole('button', { name: 'Matikan lampu' }).click()
  await expect(html).toHaveAttribute('data-tema', 'gelap')
  await expect(page.locator('#lampu img.nyala')).toBeHidden()

  await page.getByRole('button', { name: 'Nyalakan lampu' }).focus()
  await page.keyboard.press('Enter')
  await expect(html).toHaveAttribute('data-tema', 'terang')
  await expect(page.locator('#lampu img.nyala')).toBeVisible()

  test.skip(isMobile, 'menarik tali dengan mouse hanya di desktop')
  // pegang biji setelah tali dan lampu berhenti berayun, seperti tangan sungguhan
  await expect(page.locator('#lampu')).not.toHaveClass(/bergerak/, { timeout: 15_000 })
  const k = (await page.getByRole('button', { name: 'Matikan lampu' }).boundingBox())!
  const [x, y] = [k.x + k.width / 2, k.y + k.height / 2]
  await page.mouse.move(x, y)
  await page.mouse.down()
  // tarikan pendek belum memutar saklar
  await page.mouse.move(x, y + 5, { steps: 3 })
  await page.waitForTimeout(150)
  await expect(html).toHaveAttribute('data-tema', 'terang')
  await page.mouse.move(x - 10, y + 60, { steps: 8 })
  await expect(html).toHaveAttribute('data-tema', 'gelap')
  await page.mouse.up()
  // klik yang menyusul seretan tidak dihitung sebagai tarikan kedua
  await page.waitForTimeout(400)
  await expect(html).toHaveAttribute('data-tema', 'gelap')
})

test('tali lampu dengan jari: ketukan, ketukan yang bergeser, dan tarikan', async ({
  page,
  browserName,
  isMobile,
}) => {
  test.skip(!isMobile, 'sentuhan jari hanya di HP')
  await bukaHalaman(page)
  const html = page.locator('html')
  const tali = page.locator('#lampu .tarik')
  await tali.tap()
  await expect(html).toHaveAttribute('data-tema', 'gelap')

  test.skip(browserName !== 'chromium', 'menyeret dengan jari (CDP) hanya di Chromium')
  const cdp = await page.context().newCDPSession(page)
  const sentuh = (type: 'touchStart' | 'touchMove' | 'touchEnd', x = 0, y = 0) =>
    cdp.send('Input.dispatchTouchEvent', {
      type,
      touchPoints: type === 'touchEnd' ? [] : [{ x, y }],
    })
  const biji = async () => {
    await expect(page.locator('#lampu')).not.toHaveClass(/bergerak/, { timeout: 15_000 })
    const k = (await tali.boundingBox())!
    return [k.x + k.width / 2, k.y + k.height / 2]
  }

  // jari yang bergeser sedikit ke samping tetap dihitung ketukan
  let [x, y] = await biji()
  await sentuh('touchStart', x, y)
  for (let i = 1; i <= 3; i++) await sentuh('touchMove', x + 2 * i, y)
  await sentuh('touchEnd')
  await expect(html).toHaveAttribute('data-tema', 'terang')

  // tarikan panjang berbunyi sekali, dan Enter sesudahnya tetap dihitung
  ;[x, y] = await biji()
  await sentuh('touchStart', x, y)
  for (let i = 1; i <= 8; i++) await sentuh('touchMove', x, y + 8 * i)
  await expect(html).toHaveAttribute('data-tema', 'gelap')
  await sentuh('touchEnd')
  await page.waitForTimeout(400)
  await expect(html).toHaveAttribute('data-tema', 'gelap')
  await tali.focus()
  await page.keyboard.press('Enter')
  await expect(html).toHaveAttribute('data-tema', 'terang')
})

test('layar pembuka: lambang mendarat dulu, baru sketsa halaman digambar', async ({ page }) => {
  const galat: string[] = []
  page.on('pageerror', (e) => galat.push(e.message))
  await page.goto('/')
  const pembuka = page.locator('#pembuka')
  await expect(pembuka).toBeVisible()
  expect(await pikselTinta(page, '[data-sketsa="merek"] canvas')).toBe(0)
  await expect(pembuka).toHaveCount(0, { timeout: 6000 })
  await expect(page.locator('html')).not.toHaveClass(/pembuka/)
  // lambang langsung utuh di tempatnya, tulisan di bawahnya menyusul digambar
  await expect(page.locator('[data-sketsa="logo"]')).toHaveClass(/selesai/)
  await expect
    .poll(() => pikselTinta(page, '[data-sketsa="logo"] canvas.figur'))
    .toBeGreaterThan(2000)
  await expect(page.locator('[data-sketsa="merek"]')).toHaveClass(/selesai/, { timeout: 6000 })
  expect(galat).toEqual([])
})

test('layar pembuka bisa dilewati dan tidak tampil lagi di sesi yang sama', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('#pembuka')).toBeVisible()
  await page.mouse.click(30, 400)
  await expect(page.locator('#pembuka')).toHaveCount(0, { timeout: 2000 })
  await page.reload()
  await expect(page.locator('html')).not.toHaveClass(/pembuka/)
  await expect(page.locator('#pembuka')).toBeHidden()
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
  const pose = page.waitForResponse((r) => r.url().endsWith('/figur/logo-naik.webp'))
  await page.getByRole('button', { name: /^Logo Wingman Clutch/ }).click({ force: true })
  await expect.poll(() => pikselTinta(page, '[data-sketsa="kepak1"] canvas')).toBeGreaterThan(100)
  // sayap lambang ikut mengepak: pose sayap naik dimuat saat pertama kali diketuk
  expect((await pose).ok()).toBe(true)
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
