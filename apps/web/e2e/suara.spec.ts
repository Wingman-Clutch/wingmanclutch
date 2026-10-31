import { expect, test, type Page } from '@playwright/test'
import { bukaHalaman } from './bantu'

interface Catatan {
  konteks: number
  buffer: number
  mulai: number
  henti: number
}

/**
 * AudioContext tiruan yang menghitung konteks, buffer hasil sintesis, dan bunyi yang dimulai atau
 * dihentikan, tanpa benar-benar bersuara. Dipasang sebelum skrip halaman jalan.
 */
async function pasangAudioTiruan(page: Page) {
  await page.addInitScript(() => {
    const catat = { konteks: 0, buffer: 0, mulai: 0, henti: 0 }
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
        return {
          buffer: null,
          loop: false,
          playbackRate: param(),
          connect() {},
          disconnect() {},
          addEventListener() {},
          start() {
            catat.mulai++
          },
          stop() {
            catat.henti++
          },
        }
      }
    }
    Object.assign(window, { AudioContext: AudioTiruan, catatAudio: catat })
  })
}

const catatan = (page: Page) =>
  page.evaluate(() => (window as unknown as { catatAudio: Catatan }).catatAudio)
const bunyi = async (page: Page) => (await catatan(page)).mulai

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
  expect(await catatan(page)).toMatchObject({ mulai: 3, henti: 0 })
})

test('penghapus: loop selama menggosok, berhenti, lalu satu bunyi halaman bersih', async ({
  page,
}) => {
  await pasangAudioTiruan(page)
  await bukaHalaman(page)
  await bangunkan(page)
  await page.getByRole('button', { name: 'Hapus halaman lalu gambar ulang' }).click()
  await expect.poll(() => bunyi(page)).toBe(1)
  expect((await catatan(page)).henti).toBe(0)
  await expect.poll(() => catatan(page), { timeout: 8000 }).toMatchObject({ mulai: 2, henti: 1 })
})
