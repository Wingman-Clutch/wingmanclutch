import { expect, type Page } from '@playwright/test'

/** buka halaman dan tunggu semua sketsa selesai digambar */
export async function bukaHalaman(page: Page) {
  const galat: string[] = []
  page.on('pageerror', (e) => galat.push(e.message))
  page.on('console', (m) => {
    if (m.type() === 'error' && !m.text().includes('503')) galat.push(m.text())
  })
  await page.goto('/')
  await expect(
    page
      .locator('[data-sketsa="saklar-bulan"], [data-sketsa="saklar-matahari"]')
      .locator('visible=true'),
  ).toHaveClass(/selesai/, {
    timeout: 10_000,
  })
  return galat
}

/** jumlah piksel bertinta di sebuah kanvas */
export async function pikselTinta(page: Page, pemilih: string) {
  return page
    .locator(pemilih)
    .first()
    .evaluate((el) => {
      const c = el as HTMLCanvasElement
      const d = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data
      let n = 0
      for (let i = 3; i < d.length; i += 4) if (d[i] > 20) n++
      return n
    })
}
