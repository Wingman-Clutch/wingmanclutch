// Ubah dua font jadi data path untuk mesin pensil (src/data/font.json).
// Jalankan ulang setelah daftar karakter atau sumber font berubah: pnpm --filter @wingmanclutch/web font
//
// - tangan: EMS Tech (SIL OFL), font satu goresan turunan Architects Daughter, dari paket hersheytext.
// - judul: Bungee (SIL OFL) dari @fontsource/bungee. Outline-nya dipakai untuk garis tepi dan arsiran.
//
// Koordinat disimpan dalam satuan font (1000 per em) dengan sumbu y ke bawah dan garis dasar di y = 0.

import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import opentype from 'opentype.js'

const require = createRequire(import.meta.url)
const akar = dirname(dirname(fileURLToPath(import.meta.url)))
const KARAKTER = Array.from({ length: 95 }, (_, i) => String.fromCharCode(32 + i)).join('')

const bulat = (n) => Math.round(n * 10) / 10

function balikY(d) {
  // Path EMS Tech hanya memakai M dan L dengan koordinat absolut.
  return d.replace(/(-?[\d.]+)\s+(-?[\d.]+)/g, (_, x, y) => `${bulat(+x)} ${bulat(-y)}`)
}

function fontTangan() {
  const svg = readFileSync(
    join(dirname(require.resolve('hersheytext/package.json')), 'svg_fonts/EMSTech.svg'),
    'utf8',
  )
  const glyph = {}
  for (const m of svg.matchAll(/<glyph\s+([^>]*?)\/>/g)) {
    const attr = Object.fromEntries(
      [...m[1].matchAll(/([\w-]+)="([^"]*)"/g)].map((a) => [a[1], a[2]]),
    )
    const kode = attr.unicode
      ?.replace(/&#x([0-9a-f]+);/i, (_, h) => String.fromCharCode(parseInt(h, 16)))
      .replace('&amp;', '&')
      .replace('&apos;', "'")
      .replace('&quot;', '"')
      .replace('&lt;', '<')
      .replace('&gt;', '>')
    if (!kode || kode.length !== 1 || !KARAKTER.includes(kode)) continue
    glyph[kode] = [bulat(+attr['horiz-adv-x']), attr.d ? balikY(attr.d) : '']
  }
  return glyph
}

function fontJudul() {
  const berkas = require.resolve('@fontsource/bungee/files/bungee-latin-400-normal.woff')
  const buf = readFileSync(berkas)
  const font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength))
  const skala = 1000 / font.unitsPerEm
  const glyph = {}
  for (const k of KARAKTER) {
    const g = font.charToGlyph(k)
    if (!g || g.index === 0) continue
    const path = g.getPath(0, 0, 1000)
    const d = path.commands
      .map((c) => {
        const p = (x, y) => `${bulat(x)} ${bulat(y)}`
        if (c.type === 'M' || c.type === 'L') return `${c.type}${p(c.x, c.y)}`
        if (c.type === 'Q') return `Q${p(c.x1, c.y1)} ${p(c.x, c.y)}`
        if (c.type === 'C') return `C${p(c.x1, c.y1)} ${p(c.x2, c.y2)} ${p(c.x, c.y)}`
        return 'Z'
      })
      .join('')
    glyph[k] = [bulat(g.advanceWidth * skala), d]
  }
  return glyph
}

const hasil = {
  sumber: {
    tangan:
      'EMS Tech (SIL OFL 1.1), Sheldon B. Michaels, dari Architects Daughter karya Kimberly Geswein',
    judul: 'Bungee (SIL OFL 1.1), David Jonathan Ross',
  },
  tangan: fontTangan(),
  judul: fontJudul(),
}
const tujuan = join(akar, 'src/data/font.json')
writeFileSync(tujuan, JSON.stringify(hasil) + '\n')
console.log(
  `font.json: ${Object.keys(hasil.tangan).length} glyph tangan, ${Object.keys(hasil.judul).length} glyph judul`,
)
