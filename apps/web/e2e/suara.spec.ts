import { expect, test, type Page } from '@playwright/test'
import { bukaHalaman, bukaLembar } from './bantu'

interface Catatan {
  konteks: number
  buffer: number
  mulai: number
  henti: number
}

/** satu bunyi yang dimulai, dibaca dari sumber audio dan gain-nya */
interface Bunyi {
  laju: number
  volume: number
  loop: boolean
}

interface JendelaAudio {
  catatAudio: Catatan
  rincianAudio: Bunyi[]
}

/**
 * AudioContext tiruan yang menghitung konteks, buffer hasil sintesis, dan bunyi yang dimulai atau
 * dihentikan, tanpa benar-benar bersuara. Dipasang sebelum skrip halaman jalan.
 */
async function pasangAudioTiruan(page: Page) {
  await page.addInitScript(() => {
    const catat = { konteks: 0, buffer: 0, mulai: 0, henti: 0 }
    const rincian: { laju: number; volume: number; loop: boolean }[] = []
    const param = () => ({
      value: 1,
      cancelScheduledValues() {},
      cancelAndHoldAtTime() {},
      setValueAtTime() {},
      linearRampToValueAtTime() {},
    })
    class AudioTiruan {
      state = 'suspended'
      currentTime = 0
      sampleRate = 48000
      destination = {}
      constructor() {
        catat.konteks++
      }
      resume() {
        this.state = 'running'
        return Promise.resolve()
      }
      close() {
        this.state = 'closed'
        return Promise.resolve()
      }
      createBuffer(_: number, panjang: number, sampleRate: number) {
        catat.buffer++
        const kanal = [new Float32Array(panjang), new Float32Array(panjang)]
        return { sampleRate, length: panjang, getChannelData: (i: number) => kanal[i] }
      }
      createGain() {
        return { gain: param(), connect() {}, disconnect() {} }
      }
      createBufferSource() {
        let tujuan: { gain: { value: number } } | undefined
        return {
          buffer: null,
          loop: false,
          playbackRate: param(),
          connect(t: { gain: { value: number } }) {
            tujuan = t
          },
          disconnect() {},
          addEventListener() {},
          start() {
            catat.mulai++
            rincian.push({
              laju: this.playbackRate.value,
              volume: tujuan?.gain.value ?? 1,
              loop: this.loop,
            })
          },
          stop() {
            catat.henti++
          },
        }
      }
    }
    Object.assign(window, { AudioContext: AudioTiruan, catatAudio: catat, rincianAudio: rincian })
  })
}

const catatan = (page: Page) => page.evaluate(() => (window as unknown as JendelaAudio).catatAudio)
const rincian = (page: Page) =>
  page.evaluate(() => (window as unknown as JendelaAudio).rincianAudio)

/** volume sorotan mouse; butir gerakan lebih pelan lagi */
const VOLUME_SOROT = 0.12
/** bunyi utama satu aksi: sorotan mouse dan butir gerakan tidak ikut dihitung */
const bunyi = async (page: Page) =>
  (await rincian(page)).filter((b) => b.loop || b.volume > VOLUME_SOROT).length
/** butir gerakan: goresan pensil dan detak putaran figur */
const butir = async (page: Page) =>
  (await rincian(page)).filter((b) => !b.loop && b.volume < VOLUME_SOROT).length

/** gerakan pertama membangunkan audio; tunggu sampai pemutarnya mulai menyintesis bunyi */
async function bangunkan(page: Page) {
  await page.keyboard.press('Shift')
  await expect.poll(async () => (await catatan(page)).buffer).toBeGreaterThan(0)
}

/** beri waktu untuk bunyi yang mungkin menyusul, misalnya dari event close yang dikirim belakangan */
const tenang = (page: Page) => page.waitForTimeout(250)

test('tidak ada audio sebelum pengunjung bergerak; satu aksi, satu bunyi', async ({ page }) => {
  await pasangAudioTiruan(page)
  const galat = await bukaHalaman(page)
  // halaman sudah selesai digambar, tapi belum ada gerakan: belum ada konteks audio sama sekali
  expect(await catatan(page)).toEqual({ konteks: 0, buffer: 0, mulai: 0, henti: 0 })
  await bangunkan(page)
  expect(await bunyi(page)).toBe(0)

  // keyboard: Enter di sketsa membuka lembar, Escape menutupnya
  const tentang = page.getByRole('dialog', { name: 'Tentang kami' })
  await page.getByRole('button', { name: 'Tentang kami' }).focus()
  await page.keyboard.press('Enter')
  await expect(tentang).toBeVisible()
  await expect.poll(() => bunyi(page)).toBe(1)
  await page.keyboard.press('Escape')
  await expect(tentang).toBeHidden()
  await expect.poll(() => bunyi(page)).toBe(2)

  // pointer: pindah lembar lewat tombol di dalamnya cukup bunyi lembar baru yang terbuka
  await page.getByRole('button', { name: 'Tentang kami' }).click({ force: true })
  await expect.poll(() => bunyi(page)).toBe(3)
  await tentang.getByRole('button', { name: 'kenalan sama tim →' }).click()
  await expect(page.getByRole('dialog', { name: 'Tim kami' })).toBeVisible()
  await tenang(page)
  expect(await bunyi(page)).toBe(4)
  await page.keyboard.press('Escape')
  await expect.poll(() => bunyi(page)).toBe(5)

  // lampu: diklik lalu Enter, masing-masing satu bunyi saklar
  await page.getByRole('button', { name: 'Matikan lampu' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-tema', 'gelap')
  await expect.poll(() => bunyi(page)).toBe(6)
  await page.getByRole('button', { name: 'Nyalakan lampu' }).press('Enter')
  await expect(page.locator('html')).toHaveAttribute('data-tema', 'terang')
  await tenang(page)
  expect(await bunyi(page)).toBe(7)

  expect((await catatan(page)).konteks).toBe(1)
  expect(galat).toEqual([])
})

test('tombol suara: mati langsung senyap dan tetap mati setelah dimuat ulang', async ({
  page,
  isMobile,
}) => {
  await pasangAudioTiruan(page)
  await bukaHalaman(page)
  const tombol = page.getByRole('button', { name: 'suara', exact: true })
  const kaki = page.locator('#kaki')
  // kedua keadaan ada di DOM; yang dicek teks yang tampil
  const terlihat = { useInnerText: true }
  await expect(tombol).toHaveAttribute('aria-pressed', 'true')
  await expect(kaki).toContainText('suara: nyala', terlihat)

  await tombol.click()
  await expect(tombol).toHaveAttribute('aria-pressed', 'false')
  await expect(kaki).toContainText('suara: mati', terlihat)
  await page.getByRole('button', { name: 'Tentang kami' }).click({ force: true })
  await page.keyboard.press('Escape')
  await tenang(page)
  expect(await bunyi(page)).toBe(0)

  // kunjungan berikutnya: sudah tertulis mati sejak awal, dan audio tidak dibuat sama sekali
  await page.reload()
  await expect(page.locator('[data-sketsa="kepak"]')).toHaveClass(/selesai/, { timeout: 12_000 })
  await expect(tombol).toHaveAttribute('aria-pressed', 'false')
  await expect(kaki).toContainText('suara: mati', terlihat)
  await page.getByRole('button', { name: 'Tentang kami' }).click({ force: true })
  await page.keyboard.press('Escape')
  await tenang(page)
  expect(await catatan(page)).toEqual({ konteks: 0, buffer: 0, mulai: 0, henti: 0 })

  // dinyalakan lagi dengan mengetuk sedikit di atas hurufnya (bidang ketuk diperluas untuk HP);
  // ketukan itu juga membangunkan audio dan memberi satu bunyi tanda
  const b = (await tombol.boundingBox())!
  if (isMobile) await page.touchscreen.tap(b.x + b.width / 2, b.y - 8)
  else await page.mouse.click(b.x + b.width / 2, b.y - 8)
  await expect(tombol).toHaveAttribute('aria-pressed', 'true')
  await expect(kaki).toContainText('suara: nyala', terlihat)
  await expect.poll(() => bunyi(page)).toBe(1)
})

test('form kontak berbunyi setelah jawabannya ada, sekali per hasil', async ({ page }) => {
  await pasangAudioTiruan(page)
  await bukaHalaman(page)
  await bangunkan(page)
  await page.getByRole('button', { name: /Hubungi kami/ }).click({ force: true })
  const d = page.getByRole('dialog', { name: 'Hubungi Wingman Clutch' })
  await expect.poll(() => bunyi(page)).toBe(1)

  await d.getByRole('button', { name: 'kirim →' }).click()
  await expect(d.getByRole('alert').first()).toContainText('Nama belum diisi')
  await expect.poll(() => bunyi(page)).toBe(2)

  await d.getByLabel('nama kamu').fill('Sari')
  await d.getByLabel('email kamu').fill('sari@contoh.com')
  await d.getByLabel('pesan kamu').fill('Mau bikin aplikasi kasir buat warung kopi.')
  await d.getByRole('button', { name: 'kirim →' }).click()
  await expect(d.getByRole('status')).toContainText('Pesannya sudah sampai')
  await tenang(page)
  // jawabannya cepat: tidak ada loop, cukup bunyi terkirim
  expect(await bunyi(page)).toBe(3)
  expect((await catatan(page)).henti).toBe(0)
})

test('penghapus: gosokan bolak-balik, bunyi bersih, lalu pensil menggambar ulang halaman', async ({
  page,
}) => {
  await pasangAudioTiruan(page)
  await bukaHalaman(page)
  await bangunkan(page)
  await page.getByRole('button', { name: 'Hapus halaman lalu gambar ulang' }).click()
  await expect.poll(async () => (await rincian(page)).filter((b) => b.loop).length).toBe(1)
  expect((await catatan(page)).henti).toBe(0)
  // setiap baris gosokan satu bunyi, nadanya bergantian
  const gosokan = async () =>
    (await rincian(page)).filter((b) => !b.loop && b.volume > VOLUME_SOROT)
  await expect.poll(async () => (await gosokan()).length).toBeGreaterThan(1)
  const [satu, dua] = await gosokan()
  expect(dua.laju).not.toBe(satu.laju)
  // loop berhenti saat halaman bersih
  await expect.poll(async () => (await catatan(page)).henti, { timeout: 8000 }).toBeGreaterThan(0)
  // halaman digambar ulang: goresan pensil terdengar, lalu ditutup bunyi pelan saat sketsa terakhir jadi
  await expect.poll(() => butir(page), { timeout: 8000 }).toBeGreaterThan(5)
  await expect
    .poll(async () => (await rincian(page)).filter((b) => b.volume === 0.16).length, {
      timeout: 8000,
    })
    .toBe(1)
})

test('logo diketuk beruntun: nadanya naik, ketukan keempat dapat hadiah, jeda mengulang', async ({
  page,
}) => {
  await pasangAudioTiruan(page)
  await bukaHalaman(page)
  await bangunkan(page)
  const logo = page.getByRole('button', { name: /^Logo Wingman Clutch/ })
  // jeda antar-ketukan dihitung sungguhan, jadi keempatnya dikirim dalam satu tugas: lewat press
  // satu per satu, mesin yang sibuk bisa melewati JEDA_KOMBO dan hadiahnya tidak pernah berbunyi
  await logo.evaluate((el: HTMLElement) => {
    for (let i = 0; i < 4; i++) el.click()
  })
  await expect.poll(() => bunyi(page)).toBe(5)
  const kepakan = (await rincian(page)).slice(0, 4).map((b) => b.laju)
  for (let i = 1; i < 4; i++) expect(kepakan[i]).toBeGreaterThan(kepakan[i - 1])

  // setelah berhenti sebentar, ketukan berikutnya mulai dari nada terbawah lagi
  await page.waitForTimeout(1000)
  await logo.focus()
  await page.keyboard.press('Enter')
  await expect.poll(() => bunyi(page)).toBe(6)
  expect((await rincian(page)).at(-1)!.laju).toBe(kepakan[0])
})

test('figur interaktif: tombol, ukuran, dan pilihan berbunyi, putaran berdetak', async ({
  page,
  isMobile,
}) => {
  await pasangAudioTiruan(page)
  await bukaHalaman(page)
  await bangunkan(page)
  const { figur } = await bukaLembar(page, 'Tookthel')
  await expect.poll(() => bunyi(page)).toBe(1)
  await figur.getByRole('button', { name: 'Cetak struk' }).click()
  await expect.poll(() => bunyi(page)).toBe(2)
  await figur.getByRole('button', { name: 'Perbesar' }).click()
  await expect.poll(() => bunyi(page)).toBe(3)
  // bunyi pilihan mengikuti keadaan barunya: nyala dulu (toggle-on), lalu mati (toggle-off)
  const pilihan = figur.getByRole('button', { name: 'Tembus pandang' })
  await pilihan.click()
  await expect.poll(() => bunyi(page)).toBe(4)
  await pilihan.click()
  await expect.poll(() => bunyi(page)).toBe(5)
  expect((await rincian(page)).slice(-2).map((x) => x.volume)).toEqual([0.2, 0.18])
  // ketukan di figur tanpa geser bukan putaran
  const b = (await figur.locator('#fig').boundingBox())!
  await tenang(page)
  expect(await butir(page)).toBe(0)

  test.skip(isMobile, 'menyeret dengan mouse hanya di desktop')
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2)
  await page.mouse.down()
  await page.mouse.move(b.x + b.width / 2 + 120, b.y + b.height / 2, { steps: 6 })
  await expect.poll(() => butir(page)).toBeGreaterThan(0)
  await page.mouse.up()
  await expect.poll(() => bunyi(page)).toBe(6)
})

test('pensil: tiap warna punya nada, dan goresan berbunyi selama pensilnya bergerak', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'menarik garis dengan mouse hanya di desktop')
  await pasangAudioTiruan(page)
  await bukaHalaman(page)
  await bangunkan(page)
  await page.getByRole('button', { name: 'Corat-coret pakai pensil grafit' }).focus()
  await page.keyboard.press('Enter')
  await page.getByRole('button', { name: 'Corat-coret pakai pensil biru' }).focus()
  await page.keyboard.press('Enter')
  await expect.poll(() => bunyi(page)).toBe(2)
  const [grafit, biru] = await rincian(page)
  expect(biru.laju).toBeGreaterThan(grafit.laju)

  await page.mouse.move(300, 830)
  await page.mouse.down()
  // ujung pensil menyentuh kertas langsung terdengar
  await expect.poll(() => butir(page)).toBe(1)
  for (let i = 0; i < 30; i++) {
    await page.mouse.move(300 + i * 15, 830 + Math.sin(i / 3) * 25)
    await page.waitForTimeout(12)
  }
  await page.mouse.up()
  await expect.poll(() => butir(page)).toBeGreaterThan(2)
  // pensil diangkat: tidak ada yang berbunyi lagi
  const selesai = await butir(page)
  await tenang(page)
  expect(await butir(page)).toBe(selesai)
})

test('sudut dan tali lampu berbunyi saat dipegang dan dilepas, Matrix punya bunyinya sendiri', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'menyeret dengan mouse hanya di desktop')
  await pasangAudioTiruan(page)
  await bukaHalaman(page)
  await bangunkan(page)
  const html = page.locator('html')

  // tali ditarik sedikit lalu dilepas: saklarnya tidak berbunyi, tapi talinya terasa
  await expect(page.locator('#lampu')).not.toHaveClass(/bergerak/, { timeout: 15_000 })
  const t = (await page.getByRole('button', { name: 'Matikan lampu' }).boundingBox())!
  const [x, y] = [t.x + t.width / 2, t.y + t.height / 2]
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(x, y + 8, { steps: 3 })
  await expect.poll(() => bunyi(page)).toBe(1)
  await page.mouse.up()
  await expect.poll(() => bunyi(page)).toBe(2)
  await expect(html).toHaveAttribute('data-tema', 'terang')

  // tali ditarik penuh: pegang, saklar, lalu lepas
  await expect(page.locator('#lampu')).not.toHaveClass(/bergerak/, { timeout: 15_000 })
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(x - 10, y + 60, { steps: 8 })
  await expect(html).toHaveAttribute('data-tema', 'gelap')
  await page.mouse.up()
  await expect.poll(() => bunyi(page)).toBe(5)

  // sudut ditarik sedikit lalu dilepas: kertas terangkat lalu kembali
  const s = (await page.locator('#sudut').boundingBox())!
  const [sx, sy] = [s.x + s.width / 2, s.y + s.height / 2]
  await page.mouse.move(sx, sy)
  await page.mouse.down()
  await page.mouse.move(sx - 30, sy + 30, { steps: 4 })
  await expect.poll(() => bunyi(page)).toBe(6)
  await page.mouse.up()
  await expect.poll(() => bunyi(page)).toBe(7)
  await expect(html).toHaveAttribute('data-tema', 'gelap')

  // sudut dikupas: bunyi kupasan, lalu bunyi masuk Matrix saat dunianya berganti
  await expect(page.locator('#sudut')).toBeEnabled()
  await page.waitForTimeout(400)
  await page.locator('#sudut').click()
  await expect.poll(() => bunyi(page)).toBe(8)
  await expect(html).toHaveAttribute('data-tema', 'matrix', { timeout: 4000 })
  await expect.poll(() => bunyi(page)).toBe(9)
})

test('kartu nama berbunyi saat diangkat dan dilepas, dan membaliknya tetap satu bunyi', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'menyeret dengan mouse hanya di desktop')
  await pasangAudioTiruan(page)
  // gerak dikurangi: kartu langsung tergantung diam, jadi bisa dipegang di titik yang pasti
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await bukaHalaman(page)
  await bangunkan(page)
  await page.getByRole('button', { name: /^Tim kami/ }).click({ force: true })
  const kartu = page.getByRole('dialog', { name: 'Tim kami' }).getByRole('button', {
    name: /^Kartu nama Kall/,
  })
  await expect(kartu).toBeVisible()
  await expect.poll(() => bunyi(page)).toBe(1)
  const k = (await kartu.boundingBox())!
  const [x, y] = [k.x + k.width / 2, k.y + k.height * 0.6]
  await page.mouse.click(x, y)
  await expect(kartu).toHaveAttribute('aria-pressed', 'true')
  await expect.poll(() => bunyi(page)).toBe(2)
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(x + 60, y + 30, { steps: 8 })
  await expect.poll(() => bunyi(page)).toBe(3)
  await page.mouse.up()
  await expect.poll(() => bunyi(page)).toBe(4)
  await expect(kartu).toHaveAttribute('aria-pressed', 'true')
})

test('mouse menyorot sketsa dan pensil: satu bunyi pelan, tidak dihitung bunyi utama', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'sentuhan tidak punya hover')
  await pasangAudioTiruan(page)
  await bukaHalaman(page)
  await bangunkan(page)
  const sorotan = async () => (await rincian(page)).filter((b) => b.volume === VOLUME_SOROT).length
  const k = (await page.getByRole('button', { name: /^goRute:/ }).boundingBox())!
  await page.mouse.move(k.x + k.width / 2, k.y + k.height / 2)
  await expect.poll(sorotan).toBe(1)
  await page.waitForTimeout(150)
  const p = (await page
    .getByRole('button', { name: 'Corat-coret pakai pensil biru' })
    .boundingBox())!
  await page.mouse.move(p.x + p.width / 2, p.y + p.height / 2)
  await expect.poll(sorotan).toBe(2)
  expect(await bunyi(page)).toBe(0)
})

test('layar pembuka: melewatinya berbunyi sekali, ketukan pertama sesudahnya tidak', async ({
  page,
}) => {
  await pasangAudioTiruan(page)
  // Layar pembuka cuma tampil beberapa detik, dan di mesin sibuk tiap langkah Playwright bisa makan
  // hampir sedetik, jadi urutannya dijalankan di dalam halaman. Click membangunkan pemutar tanpa
  // melewati layar itu, yang hanya mendengar pointerdown dan keydown; begitu pemutarnya mulai
  // menyintesis bunyi, tombol ditekan.
  await page.addInitScript(() => {
    addEventListener('DOMContentLoaded', () => {
      dispatchEvent(new Event('click'))
      const tunggu = setInterval(() => {
        if (!(window as unknown as JendelaAudio).catatAudio.buffer) return
        clearInterval(tunggu)
        dispatchEvent(new KeyboardEvent('keydown', { key: 'Shift' }))
      }, 10)
    })
  })
  await page.goto('/')
  await expect.poll(() => bunyi(page)).toBe(1)
  await expect(page.locator('html')).not.toHaveClass(/pembuka/)
  await page.mouse.click(5, 5)
  await tenang(page)
  expect(await bunyi(page)).toBe(1)
})
