import '@fontsource/special-elite/400.css'
import './gaya/halaman.css'
import './gaya/dialog.css'
import { GERAK_DIKURANGI } from './engine/animasi'
import type { Tema } from './engine/kuas'
import { Baki } from './halaman/baki'
import { Dialog } from './halaman/dialog'
import { Hujan } from './halaman/hujan'
import { gambarKertas, KERTAS, ubinButiran } from './halaman/kertas'
import { pasangKontak } from './halaman/kontak'
import { Lampu } from './halaman/lampu'
import { Lipatan } from './halaman/lipatan'
import { Papan } from './halaman/papan'
import { Pembuka } from './halaman/pembuka'
import { BUNYI, suara } from './halaman/suara'
import { atasKaki, hitungUkuran, type Ukuran } from './halaman/tata-letak'
import { kepakkan } from './sketsa/logo'

const $ = <T extends HTMLElement>(s: string) => document.querySelector(s) as T
const akar = document.documentElement
const app = $('#app')
const kanvasKertas = $<HTMLCanvasElement>('#kertas')

/** kertas terang atau gelap (disimpan), dan apakah sedang di dalam Matrix (tidak disimpan) */
let kertas: 'terang' | 'gelap' = akar.dataset.tema === 'gelap' ? 'gelap' : 'terang'
let matrix = false
const tema = (): Tema => (matrix ? 'matrix' : kertas)
let ukuran: Ukuran

// butiran kertas tidak dibutuhkan untuk lukisan pertama, jadi dibuat saat browser senggang
const pasangButiran = () => akar.style.setProperty('--butiran', `url(${ubinButiran()})`)
if ('requestIdleCallback' in window) requestIdleCallback(pasangButiran, { timeout: 1000 })
else setTimeout(pasangButiran, 300)

const dialog = new Dialog(tema)
const hujan = new Hujan($<HTMLCanvasElement>('#hujan'))

const papan = new Papan($('#papan'), (a, sumber) => {
  if (a.jenis === 'logo') ketukLogo()
  else if (a.jenis === 'proyek') dialog.buka('proyek', sumber, a.id)
  else dialog.buka(a.jenis, sumber)
})

const lampu = new Lampu($('#lampu'), () => {
  gantiKertas()
  suara.mainkan(kertas === 'terang' ? BUNYI.lampuNyala : BUNYI.lampuPadam)
})

const baki = new Baki(
  $('#baki'),
  $<HTMLCanvasElement>('#coretan'),
  $<HTMLCanvasElement>('#noda'),
  $<HTMLCanvasElement>('#remah'),
  $<HTMLButtonElement>('#penghapus'),
  $('#bar-coret'),
  papan,
  () => papan.pembukaan(),
)

const lipatan = new Lipatan(
  $('#lipatan'),
  $<HTMLButtonElement>('#sudut'),
  () => {
    matrix = !matrix
    terapkanTema()
  },
  () => !baki.menghapus,
)

function ketukLogo() {
  const logo = papan.sketsa.get('logo')!
  const kepak = [...papan.sketsa.values()].filter((s) => s.el.classList.contains('kepak'))
  for (const el of [logo.el, ...kepak.map((s) => s.el)]) {
    el.classList.remove('kepak-gerak')
    void el.offsetWidth
    el.classList.add('kepak-gerak')
  }
  papan.kepak()
  if (!GERAK_DIKURANGI) void kepakkan((p) => logo.pose(p))
}

function terapkanTema() {
  const t = tema()
  akar.dataset.tema = t
  $<HTMLMetaElement>('meta[name="theme-color"]').content = KERTAS[t].warna
  gambarKertas(kanvasKertas, ukuran, t)
  papan.warnai(t)
  baki.warnai(t)
  lampu.warnai(kertas === 'terang')
  dialog.warnai()
  if (t === 'matrix') hujan.mulai()
  else hujan.berhenti()
}

function gantiKertas() {
  kertas = kertas === 'terang' ? 'gelap' : 'terang'
  matrix = false
  try {
    localStorage.setItem('wc-tema', kertas)
  } catch {
    // penyimpanan diblokir: tema tetap berganti untuk kunjungan ini
  }
  terapkanTema()
}

function tata() {
  ukuran = hitungUkuran(app.clientWidth, app.clientHeight)
  akar.dataset.tata = ukuran.kunci
  akar.style.setProperty('--u', ukuran.k + 'px')
  akar.style.setProperty('--kaki', atasKaki(ukuran) + 'px')
  gambarKertas(kanvasKertas, ukuran, tema())
  papan.atur(ukuran, tema())
  baki.atur(ukuran, tema())
  lampu.atur(ukuran)
  // hujan di belakang sketsa hanya terlihat di tema matrix
  hujan.atur(Math.max(12, 18 * ukuran.k), tema() === 'matrix' ? Infinity : 0)
  lipatan.atur()
}

suara.pasang($<HTMLButtonElement>('#suara'))
pasangKontak()
tata()
lampu.warnai(kertas === 'terang')
if (GERAK_DIKURANGI) akar.classList.add('gerak-dikurangi')

// layar pembuka (kalau skrip di <head> memutuskan tampil): lambang mendarat dulu, baru sketsa jalan
if (akar.classList.contains('pembuka')) {
  const pembuka = new Pembuka($('#pembuka'))
  const logo = papan.sketsa.get('logo')!
  void pembuka
    .jalan(() => logo.kanvas.getBoundingClientRect())
    .then(() => {
      papan.pembukaan({ logoSiap: true })
      requestAnimationFrame(() => pembuka.tutup())
    })
} else papan.pembukaan()

let jeda = 0
addEventListener('resize', () => {
  clearTimeout(jeda)
  jeda = window.setTimeout(tata, 120)
})

// tema sistem berubah dan pengguna belum pernah memilih sendiri
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  let tersimpan: string | null = null
  try {
    tersimpan = localStorage.getItem('wc-tema')
  } catch {
    // abaikan
  }
  if (tersimpan) return
  kertas = e.matches ? 'gelap' : 'terang'
  terapkanTema()
})
