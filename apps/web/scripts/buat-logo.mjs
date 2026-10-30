// Ubah logo brand (docs/brand/wingman-clutch-logo.svg) jadi path halus untuk mesin pensil
// (src/data/logo.json). Jalankan ulang kalau logo brand berubah: node scripts/buat-logo.mjs
//
// Logo brand hasil tracing, jadi tepinya bertangga per piksel. Setiap subpath disederhanakan
// (Ramer-Douglas-Peucker) lalu dihaluskan sekali (Chaikin) supaya garis pensilnya mulus.
// Tagline tidak diambil: di halaman, tagline ditulis tangan.

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const akar = dirname(dirname(fileURLToPath(import.meta.url)))
const svg = readFileSync(join(akar, '../../docs/brand/wingman-clutch-logo.svg'), 'utf8')
const d = svg.match(/ d="([^"]+)"/)[1]

const subpath = d
  .split(/(?=M)/)
  .map((s) => [...s.matchAll(/(-?[\d.]+),(-?[\d.]+)/g)].map((m) => [+m[1], +m[2]]))
  .filter((t) => t.length > 2)

function jarakKeGaris(p, a, b) {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const l = Math.hypot(dx, dy)
  if (l === 0) return Math.hypot(p[0] - a[0], p[1] - a[1])
  return Math.abs(dy * p[0] - dx * p[1] + b[0] * a[1] - b[1] * a[0]) / l
}

function rdp(titik, eps) {
  if (titik.length < 3) return titik
  let maks = 0
  let idx = 0
  for (let i = 1; i < titik.length - 1; i++) {
    const j = jarakKeGaris(titik[i], titik[0], titik[titik.length - 1])
    if (j > maks) {
      maks = j
      idx = i
    }
  }
  if (maks <= eps) return [titik[0], titik[titik.length - 1]]
  return [...rdp(titik.slice(0, idx + 1), eps).slice(0, -1), ...rdp(titik.slice(idx), eps)]
}

function chaikin(titik) {
  const hasil = []
  for (let i = 0; i < titik.length; i++) {
    const a = titik[i]
    const b = titik[(i + 1) % titik.length]
    hasil.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25])
    hasil.push([a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75])
  }
  return hasil
}

const bulat = (n) => Math.round(n * 10) / 10
const keD = (t) => 'M' + t.map((p) => `${bulat(p[0])} ${bulat(p[1])}`).join('L') + 'Z'

function bagian(y0, y1, eps) {
  return subpath
    .filter((t) => {
      const ys = t.map((p) => p[1])
      return Math.min(...ys) >= y0 && Math.max(...ys) <= y1
    })
    .map((t) => {
      // Titik pertama diulang di akhir supaya RDP memperlakukan subpath sebagai cincin.
      const s = rdp([...t, t[0]], eps).slice(0, -1)
      return keD(s.length > 5 ? chaikin(s) : s)
    })
    .join('')
}

const logo = {
  sumber: 'docs/brand/wingman-clutch-logo.svg (viewBox 872 x 725)',
  lambang: bagian(0, 440, 1.4),
  wingman: bagian(460, 560, 0.9),
  clutch: bagian(570, 640, 0.8),
}
writeFileSync(join(akar, 'src/data/logo.json'), JSON.stringify(logo, null, 1) + '\n')
console.log(
  'logo.json:',
  Object.entries(logo)
    .map(([k, v]) => `${k} ${v.length}`)
    .join(', '),
)
