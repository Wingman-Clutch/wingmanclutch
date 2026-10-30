// Halaman figur interaktif (public/figur/*.html), gambar diamnya (public/figur/*.webp), dan
// ukurannya (src/data/figur.json), dari sumber di figur/. Hasilnya di-commit, jadi build produksi
// tidak butuh Python. Jalankan setelah figur berubah: pnpm --filter @wingmanclutch/web figur
//
// Memakai build.py dari Colorfigures (butuh python3) dan Chromium dari Playwright.

import { execFileSync } from 'node:child_process'
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

/** `diam` = keadaan figur di gambar halaman; `lembar: false` = hanya dipakai sebagai gambar diam */
const FIGUR = [
  { id: 'postpocket', diam: 'flap=1&rise=1' },
  { id: 'gorute', diam: 'rute=1&bus=1&door=1' },
  { id: 'tikoem', diam: 'friends=3&meet=1&drop=1' },
  { id: 'tookthel', diam: 'print=1' },
  { id: 'tim', diam: '', lembar: false },
]

/** sisi terpanjang gambar diam: cukup tajam untuk desktop lebar di layar 2x */
const SISI_MAKS = 720
const LEBAR_RENDER = 2000

const akar = dirname(dirname(fileURLToPath(import.meta.url)))
const figur = join(akar, 'figur')
const keluar = join(akar, 'public/figur')
const kerja = mkdtempSync(join(tmpdir(), 'figur-'))
mkdirSync(keluar, { recursive: true })

const baca = (p) => readFileSync(p, 'utf8')

/** catatan lisensi MIT Colorfigures, syaratnya ikut di setiap salinan engine */
const KEPALA =
  '<!doctype html>\n<!-- Dibuat scripts/buat-figur.mjs dari figur/. Ubah sumbernya, jangan berkas ini. -->\n' +
  `<!-- Engine: Colorfigures, https://april-zhu.com/colorfigures\n\n${baca(join(figur, 'colorfigures/LICENSE')).trim()}\n-->\n`

/** tema dari halaman induk dipasang sebelum dicat, supaya color-scheme iframe sama dengan induknya */
const AWAL =
  `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; font-src 'self'; base-uri 'none'; form-action 'none'">` +
  '<meta name="robots" content="noindex">' +
  "<script>document.documentElement.dataset.tema = new URLSearchParams(location.search).get('tema') || 'terang'</script>"

const AKHIR = `<style>${baca(join(figur, 'sematan.css'))}</style><script>${baca(join(figur, 'sematan.js'))}</script>`

/** satu halaman mandiri dari build.py */
function bangun(id) {
  const hasil = join(kerja, `${id}.html`)
  execFileSync(
    'python3',
    ['-I', join(figur, 'colorfigures/scripts/build.py'), join(figur, `${id}.html`), hasil],
    { stdio: 'ignore' },
  )
  return hasil
}

/** halaman build.py ditambah kepala lisensi, CSP, dan penyesuaian lembar detail */
function halamanLembar(berkas) {
  const html = baca(berkas)
  const kepala = html.indexOf('<head>') + '<head>'.length
  const badan = html.lastIndexOf('</body>')
  return (
    KEPALA +
    html.slice(html.indexOf('<html'), kepala) +
    AWAL +
    html.slice(kepala, badan) +
    AKHIR +
    html.slice(badan)
  )
}

/** figur saja tanpa tombol dan latar; PNG besar dengan latar transparan */
async function potret(browser, berkas, query) {
  const p = await browser.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 2 })
  const galat = []
  p.on('pageerror', (e) => galat.push(e.message))
  await p.goto(`file://${berkas}?${query}`)
  // noise filter tangan dipanggang engine sesaat setelah halaman terbuka
  await p.waitForTimeout(800)
  await p.addStyleTag({
    content: `html, html body { height: auto; background: none; padding: 0; overflow: visible }
      body > :not(.stage), .stage > :not(.zwrap), .zwrap > :not(#fig) { display: none !important }
      #fig { width: ${LEBAR_RENDER / 2}px !important; max-width: none !important; max-height: none !important; overflow: hidden }`,
  })
  await p.evaluate((lebar) => {
    const svg = document.getElementById('fig')
    const b = document.getElementById('art').getBBox()
    const m = 12
    svg.setAttribute('viewBox', `${b.x - m} ${b.y - m} ${b.width + 2 * m} ${b.height + 2 * m}`)
    svg.style.height = `${(lebar * (b.height + 2 * m)) / (b.width + 2 * m)}px`
  }, LEBAR_RENDER / 2)
  await p.waitForTimeout(200)
  if (galat.length) throw new Error(`${berkas}: ${galat.join('; ')}`)
  const png = await p.locator('#fig').screenshot({ omitBackground: true })
  await p.close()
  return png
}

/** potong ke batas piksel berisi, kecilkan, lalu simpan sebagai WebP lewat canvas Chromium */
async function keWebp(browser, png) {
  const p = await browser.newPage()
  const { data, w, h } = await p.evaluate(
    async ([b64, sisi]) => {
      const img = new Image()
      img.src = 'data:image/png;base64,' + b64
      await img.decode()
      const c = document.createElement('canvas')
      c.width = img.naturalWidth
      c.height = img.naturalHeight
      const g = c.getContext('2d', { willReadFrequently: true })
      g.drawImage(img, 0, 0)
      const d = g.getImageData(0, 0, c.width, c.height).data
      let [x0, y0, x1, y1] = [c.width, c.height, 0, 0]
      for (let y = 0; y < c.height; y++)
        for (let x = 0; x < c.width; x++)
          if (d[(y * c.width + x) * 4 + 3] > 8) {
            x0 = Math.min(x0, x)
            y0 = Math.min(y0, y)
            x1 = Math.max(x1, x)
            y1 = Math.max(y1, y)
          }
      const lebar = x1 - x0 + 1
      const tinggi = y1 - y0 + 1
      const k = Math.min(1, sisi / Math.max(lebar, tinggi))
      const o = document.createElement('canvas')
      o.width = Math.round(lebar * k)
      o.height = Math.round(tinggi * k)
      const kecil = o.getContext('2d')
      kecil.imageSmoothingQuality = 'high'
      kecil.drawImage(c, x0, y0, lebar, tinggi, 0, 0, o.width, o.height)
      return { data: o.toDataURL('image/webp', 0.84).split(',')[1], w: o.width, h: o.height }
    },
    [png.toString('base64'), SISI_MAKS],
  )
  await p.close()
  return { webp: Buffer.from(data, 'base64'), w, h }
}

const browser = await chromium.launch()
const ukuran = {}
for (const { id, diam, lembar = true } of FIGUR) {
  const berkas = bangun(id)
  if (lembar) writeFileSync(join(keluar, `${id}.html`), halamanLembar(berkas))
  const { webp, w, h } = await keWebp(browser, await potret(browser, berkas, diam))
  writeFileSync(join(keluar, `${id}.webp`), webp)
  ukuran[id] = { w, h }
  console.log(`${id}: ${w} x ${h}, ${Math.round(webp.length / 1024)} KB`)
}
await browser.close()
rmSync(kerja, { recursive: true })

// huruf yang sama dengan teks dialog, supaya tombol di dalam figur menyatu dengan lembarnya
const require = createRequire(join(akar, 'package.json'))
copyFileSync(
  join(
    dirname(require.resolve('@fontsource/special-elite/package.json')),
    'files/special-elite-latin-400-normal.woff2',
  ),
  join(keluar, 'special-elite.woff2'),
)
writeFileSync(join(akar, 'src/data/figur.json'), JSON.stringify(ukuran, null, 2) + '\n')
