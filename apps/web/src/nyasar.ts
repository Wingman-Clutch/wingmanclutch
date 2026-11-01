// Halaman 404: angka pensil yang kegosok, dan stiker penghapus yang masih nongkrong di situ. Setiap
// ketukan di stiker menggosok sedikit lagi.

import '@fontsource/special-elite/400.css'
import './gaya/halaman.css'
import './gaya/nyasar.css'
import { buatAcak } from './engine/acak'
import { GERAK_DIKURANGI, jadwalkan } from './engine/animasi'
import { sampelUlang, type Garis } from './engine/jalur'
import { DPR, Sketsa } from './engine/sketsa'
import { gambarKertas, ubinButiran } from './halaman/kertas'
import { BERTUMPUK, BUNYI, suara } from './halaman/suara'
import { hitungUkuran } from './halaman/tata-letak'
import { angka, keterangan } from './sketsa/nyasar'
import { play, type Player } from './stiker/fun'
import { penghapus } from './stiker/ikon'
import { PALET } from './stiker/warna'

const $ = <T extends HTMLElement>(s: string) => document.querySelector(s) as T
const akar = document.documentElement
const app = $('#app')
const kertas = $<HTMLCanvasElement>('#kertas')
const noda = $<HTMLCanvasElement>('#noda')
const papan = $('#papan')
const stiker = $<HTMLButtonElement>('#stiker')
const bawah = $('#bawah')
const merek = $('#merek')
const tema = akar.dataset.tema === 'gelap' ? 'gelap' : 'terang'

/** letak setiap bagian dalam satuan adegan; angka dan teks di tengah, stiker menggantung di kanannya */
const TATA = {
  lanskap: {
    tengah: 850,
    merek: [760, 60, 180],
    angka: 240,
    skala: 1,
    tulisan: 610,
    teks: 696,
    stiker: [1150, 205, 460],
  },
  potret: {
    tengah: 500,
    merek: [395, 480, 210],
    angka: 710,
    skala: 0.74,
    tulisan: 980,
    teks: 1080,
    stiker: [716, 600, 320],
  },
} as const

const sketsaAngka = new Sketsa('angka', angka)
const sketsaKeterangan = new Sketsa('keterangan', keterangan)
papan.append(sketsaAngka.el, sketsaKeterangan.el)

/** jalur gosokan di angka 4 terakhir, dari kakinya ke atas, dalam pecahan kotak goresan angka */
const JALUR: Garis = [
  [0.86, 0.98],
  [1.02, 0.95],
  [0.8, 0.88],
  [1.02, 0.84],
  [0.76, 0.76],
  [1.02, 0.72],
  [0.74, 0.62],
  [1.02, 0.58],
  [0.74, 0.48],
  [1.02, 0.42],
  [0.74, 0.32],
  [1.02, 0.26],
]
/** seberapa jauh jalur sudah digosok: saat halaman terbuka, lalu setelah setiap ketukan */
const TAHAP = [0.3, 0.55, 0.78, 1]
let tahap = 0
let tergosok = 0

/** titik-titik jalur gosokan antara dua pecahan jalur */
function potongJalur(dari: number, ke: number) {
  const titik = sampelUlang(JALUR, 0.02)
  return titik.slice(Math.max(0, Math.floor(dari * titik.length) - 1), Math.ceil(ke * titik.length))
}

function gosokSampai(sampai: number) {
  const b = sketsaAngka.batas
  const skala = sketsaAngka.tempat.skala * DPR()
  const potong = potongJalur(tergosok, sampai)
  if (potong.length < 2 || sampai <= tergosok) return
  const g = sketsaAngka.ctx
  g.save()
  g.globalCompositeOperation = 'destination-out'
  g.lineCap = 'round'
  g.lineJoin = 'round'
  g.lineWidth = b.h * 0.15 * skala
  g.beginPath()
  potong.forEach(([x, y], i) => {
    if (i) g.lineTo(x * b.w * skala, y * b.h * skala)
    else g.moveTo(x * b.w * skala, y * b.h * skala)
  })
  g.stroke()
  g.restore()
  tergosok = sampai
}

/**
 * Bekas tipis di kertas, seperti yang ditinggalkan penghapus di halaman utama: garis-garis kecil,
 * bukan satu sapuan lebar. Digambar sekali per gosokan, karena garis transparan yang ditimpa setiap
 * frame menumpuk jadi gumpalan.
 */
function bekasGosok(dari: number, ke: number) {
  const b = sketsaAngka.batas
  const t = sketsaAngka.tempat
  const dpr = DPR()
  const kotak = sketsaAngka.el.getBoundingClientRect()
  const potong = potongJalur(dari, ke)
  const warna = tema === 'gelap' ? '214, 222, 240' : '104, 102, 112'
  const acak = buatAcak(404)
  const g = noda.getContext('2d')!
  g.save()
  g.lineCap = 'round'
  g.lineJoin = 'round'
  for (let i = 0; i < 9; i++) {
    const geser = acak(-0.09, 0.09)
    g.strokeStyle = `rgba(${warna}, ${acak(0.012, 0.03).toFixed(3)})`
    g.lineWidth = acak(0.004, 0.022) * b.h * t.skala * dpr
    g.beginPath()
    potong.forEach(([x, y], n) => {
      const px = (kotak.left + x * b.w * t.skala) * dpr
      const py = (kotak.top + (y + geser) * b.h * t.skala) * dpr
      if (n) g.lineTo(px, py)
      else g.moveTo(px, py)
    })
    g.stroke()
  }
  g.restore()
}

function tata() {
  const u = hitungUkuran(app.clientWidth, app.clientHeight)
  const T = TATA[u.kunci]
  akar.dataset.tata = u.kunci
  akar.style.setProperty('--u', u.k + 'px')
  gambarKertas(kertas, u, tema)
  const dpr = DPR()
  noda.width = Math.ceil(noda.clientWidth * dpr)
  noda.height = Math.ceil(noda.clientHeight * dpr)
  const x = u.kiri + T.tengah * u.k
  const skala = T.skala * u.k
  sketsaAngka.tempatkan({ x, y: u.atas + T.angka * u.k, skala, r: 0 }, tema)
  sketsaKeterangan.tempatkan({ x, y: u.atas + T.tulisan * u.k, skala, r: 0 }, tema)
  const [sx, sy, sw] = T.stiker
  Object.assign(stiker.style, {
    left: u.kiri + sx * u.k + 'px',
    top: u.atas + sy * u.k + 'px',
    right: 'auto',
    width: sw * u.k + 'px',
  })
  const [mx, my, mw] = T.merek
  Object.assign(merek.style, {
    left: u.kiri + mx * u.k + 'px',
    top: u.atas + my * u.k + 'px',
    width: mw * u.k + 'px',
  })
  bawah.style.top = u.atas + T.teks * u.k + 'px'
  // ukuran kanvas berubah, jadi gosokan yang sudah ada dibuat ulang
  const sudah = tergosok
  tergosok = 0
  if (sudah) {
    gosokSampai(sudah)
    bekasGosok(0, sudah)
  }
}

let pemain: Player | undefined

/** gosokan ke tahap berikutnya, menyusul sapuan stiker */
function gosok(tunda: number) {
  const dari = tergosok
  const ke = TAHAP[tahap]
  jadwalkan(
    tunda,
    420,
    (p) => gosokSampai(dari + (ke - dari) * p),
    () => bekasGosok(dari, ke),
  )
}

function munculkanStiker() {
  pemain = play(stiker.querySelector('canvas')!, penghapus, { palette: PALET, enter: 0 })
  pemain.replay()
  stiker.classList.add('siap')
  gosok(GERAK_DIKURANGI ? 0 : 640)
}

stiker.addEventListener('click', () => {
  pemain?.replay()
  suara.mainkan(BUNYI.gosokHapus, BERTUMPUK)
  if (tahap < TAHAP.length - 1) {
    tahap++
    gosok(GERAK_DIKURANGI ? 0 : 640)
  }
})

suara.pasang(null)
sketsaAngka.siapkan()
sketsaKeterangan.siapkan()
tata()
addEventListener('resize', tata)
jadwalkan(
  200,
  1000,
  (p) => sketsaAngka.gambar(p),
  () => sketsaAngka.el.classList.add('selesai'),
)
jadwalkan(
  1100,
  650,
  (p) => sketsaKeterangan.gambar(p),
  () => {
    sketsaKeterangan.el.classList.add('selesai')
    munculkanStiker()
  },
)
setTimeout(() => akar.style.setProperty('--butiran', `url(${ubinButiran()})`), 300)
