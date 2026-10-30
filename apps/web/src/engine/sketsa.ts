// Sketsa = satu gambar di kanvasnya sendiri. Bisa digambar sedikit demi sedikit (progres 0..1) dan
// digambar ulang penuh setelah tema atau ukuran berubah. Sketsa boleh punya figur: gambar berwarna
// di kanvas terpisah di bawah goresan, yang muncul mengikuti coretan krayon.
// Goresannya baru dikompilasi saat dibutuhkan (siapkan), karena mengompilasi semua sketsa
// sekaligus mengunci main thread saat halaman dibuka.

import { batasGoresan, kompilasi, type Goresan, type Op } from './goresan'
import { buatAcak, hashTeks } from './acak'
import { sampelUlang, type Garis, type Titik } from './jalur'
import { gambarRentang, TINTA, type Kanvas, type Tema } from './kuas'

export const DPR = () => Math.min(typeof devicePixelRatio === 'number' ? devicePixelRatio : 1, 2)

interface Lapisan {
  goresan: Goresan[]
  total: number
  /** panjang yang sudah tergambar */
  tergambar: number
  /** indeks goresan dan panjang di dalamnya yang sudah tergambar */
  idx: number
  dalam: number
}

function lapisan(ops: Op[], benih: number): Lapisan {
  const goresan = kompilasi(ops, benih)
  let total = 0
  for (const g of goresan) total += g.panjang
  return { goresan, total, tergambar: 0, idx: 0, dalam: 0 }
}

function gambarLapisanSampai(l: Lapisan, target: number, k: Kanvas, tema: Tema) {
  const tinta = TINTA[tema]
  while (l.tergambar < target && l.idx < l.goresan.length) {
    const g = l.goresan[l.idx]
    const butuh = target - l.tergambar
    const sisa = g.panjang - l.dalam
    const ambil = Math.min(butuh, sisa)
    gambarRentang(k, g, l.dalam, l.dalam + ambil, tinta)
    l.dalam += ambil
    l.tergambar += ambil
    if (l.dalam >= g.panjang - 1e-6) {
      l.idx++
      l.dalam = 0
    }
  }
  k.ctx.globalAlpha = 1
}

function kosongkan(l: Lapisan) {
  l.tergambar = 0
  l.idx = 0
  l.dalam = 0
}

export interface Penempatan {
  /** posisi titik (0, 0) gambar di layar, piksel CSS relatif terhadap papan */
  x: number
  y: number
  /** piksel CSS per satuan gambar */
  skala: number
  /** rotasi dalam derajat, di sekitar tengah kanvas */
  r: number
}

/** gambar berwarna di bawah goresan sketsa; posisi dan ukuran dalam satuan gambar */
export interface Figur {
  src: string
  x: number
  y: number
  w: number
  h: number
}

/** arsiran krayon miring yang menutup kotak 0..1, dari pojok kiri atas ke pojok kanan bawah */
export function jalurKrayon(benih: number, baris = 10): Garis {
  const acak = buatAcak(benih)
  const miring = (v: number) => v + acak(-0.04, 0.04)
  const zig: Garis = []
  for (let i = 0; i <= baris; i++) {
    const s = (2 * i) / baris
    const a: Titik = s < 1 ? [miring(s), 0] : [1, miring(s - 1)]
    const b: Titik = s < 1 ? [0, miring(s)] : [miring(s - 1), 1]
    zig.push(...(i % 2 ? [b, a] : [a, b]))
  }
  return sampelUlang(zig, 0.04)
}

export class Sketsa {
  readonly id: string
  readonly el: HTMLElement
  readonly kanvas: HTMLCanvasElement
  readonly ctx: CanvasRenderingContext2D
  private buatOps: () => Op[]
  private dasar?: Lapisan
  private kotak = { x: 0, y: 0, w: 0, h: 0 }
  /** tempatkan() dipanggil sebelum goresan siap; diterapkan begitu siapkan() selesai */
  private tertunda = false
  private figur?: Figur
  private figurKanvas?: HTMLCanvasElement
  private figurCtx?: CanvasRenderingContext2D
  /** terisi setelah gambar figur selesai dimuat */
  private figurGambar?: HTMLImageElement
  private krayon: Garis = []
  tempat: Penempatan = { x: 0, y: 0, skala: 1, r: 0 }
  progres = 0
  private tema: Tema = 'terang'

  constructor(id: string, ops: () => Op[], figur?: Figur, el?: HTMLElement) {
    this.id = id
    this.buatOps = ops
    this.figur = figur
    this.el = el ?? document.createElement('div')
    this.el.classList.add('sketsa')
    this.el.dataset.sketsa = id
    // tersembunyi sampai pertama kali ditempatkan, supaya kanvas kosong yang belum punya ukuran
    // tidak tampil lalu bergeser (layout shift)
    this.el.style.visibility = 'hidden'
    this.kanvas = document.createElement('canvas')
    this.kanvas.setAttribute('aria-hidden', 'true')
    this.el.appendChild(this.kanvas)
    this.ctx = this.kanvas.getContext('2d')!
    if (figur) {
      this.figurKanvas = document.createElement('canvas')
      this.figurKanvas.className = 'figur'
      this.figurKanvas.setAttribute('aria-hidden', 'true')
      this.el.prepend(this.figurKanvas)
      this.figurCtx = this.figurKanvas.getContext('2d')!
      const img = new Image()
      img.src = figur.src
      img
        .decode()
        .then(() => {
          this.figurGambar = img
          this.gambarFigur()
        })
        // gambar gagal dimuat: nama sketsanya tetap tergambar
        .catch(() => {})
    }
  }

  get siap() {
    return this.dasar !== undefined
  }

  /** kompilasi goresan, sekali saja */
  siapkan() {
    if (this.dasar) return
    const benih = hashTeks(this.id)
    this.dasar = lapisan(this.buatOps(), benih)
    this.kotak = batasGoresan(this.dasar.goresan)
    if (this.figur) this.krayon = jalurKrayon(benih)
    if (this.tertunda) {
      this.tertunda = false
      this.tempatkan(this.tempat, this.tema)
    }
  }

  /** kotak semua goresan dalam satuan gambar */
  get batas() {
    this.siapkan()
    return this.kotak
  }

  private kanvasInfo(ctx: CanvasRenderingContext2D): Kanvas {
    return { ctx, skala: this.tempat.skala * DPR(), x0: this.kotak.x, y0: this.kotak.y }
  }

  /** pasang posisi dan ukuran; kanvas dibuat ulang dan isinya digambar lagi sampai progresnya */
  tempatkan(t: Penempatan, tema: Tema) {
    this.tempat = t
    this.tema = tema
    if (!this.dasar) {
      this.tertunda = true
      return
    }
    const lebar = this.kotak.w * t.skala
    const tinggi = this.kotak.h * t.skala
    const dpr = DPR()
    for (const c of this.semuaKanvas) {
      c.width = Math.max(1, Math.ceil(lebar * dpr))
      c.height = Math.max(1, Math.ceil(tinggi * dpr))
      c.style.width = lebar + 'px'
      c.style.height = tinggi + 'px'
    }
    Object.assign(this.el.style, {
      left: t.x + this.kotak.x * t.skala + 'px',
      top: t.y + this.kotak.y * t.skala + 'px',
      width: lebar + 'px',
      height: tinggi + 'px',
      rotate: t.r + 'deg',
      visibility: '',
    })
    this.gambarUlang()
  }

  /** ganti tema tanpa mengubah posisi */
  warnai(tema: Tema) {
    this.tema = tema
    if (this.dasar) this.gambarUlang()
  }

  private gambarUlang() {
    this.ctx.clearRect(0, 0, this.kanvas.width, this.kanvas.height)
    const p = this.progres
    kosongkan(this.dasar!)
    this.progres = 0
    if (p > 0) this.gambar(p)
  }

  /** gambar sampai progres p (0..1); hanya bagian yang belum tergambar yang ditambahkan */
  gambar(p: number) {
    if (p <= this.progres) return
    this.siapkan()
    this.progres = p
    const dasar = this.dasar!
    gambarLapisanSampai(dasar, dasar.total * p, this.kanvasInfo(this.ctx), this.tema)
    this.gambarFigur()
  }

  /** figur sebanyak progres: krayon digoreskan dulu, lalu gambarnya mengisi bagian yang tercoret */
  private gambarFigur() {
    const g = this.figurCtx
    const f = this.figur
    const img = this.figurGambar
    if (!g || !f || !img || !this.progres) return
    const k = this.tempat.skala * DPR()
    const x = (f.x - this.kotak.x) * k
    const y = (f.y - this.kotak.y) * k
    const w = f.w * k
    const h = f.h * k
    g.clearRect(0, 0, g.canvas.width, g.canvas.height)
    g.save()
    if (this.progres < 1) {
      g.lineCap = 'round'
      g.lineJoin = 'round'
      g.lineWidth = Math.max(w, h) * 0.2
      g.beginPath()
      const n = Math.ceil(this.krayon.length * this.progres)
      for (let i = 0; i < n; i++) g.lineTo(x + this.krayon[i][0] * w, y + this.krayon[i][1] * h)
      g.stroke()
      g.globalCompositeOperation = 'source-in'
    }
    g.drawImage(img, x, y, w, h)
    g.restore()
  }

  /** kosongkan kanvas dan mulai dari nol */
  ulang() {
    this.progres = 0
    if (this.dasar) kosongkan(this.dasar)
    for (const c of this.semuaKanvas) c.getContext('2d')!.clearRect(0, 0, c.width, c.height)
  }

  /** ubah titik layar (piksel CSS relatif papan) ke koordinat piksel kanvas sketsa */
  keKanvas(x: number, y: number): [number, number] {
    const t = this.tempat
    const b = this.batas
    const kiri = t.x + b.x * t.skala
    const atas = t.y + b.y * t.skala
    const w = b.w * t.skala
    const h = b.h * t.skala
    const dx = x - (kiri + w / 2)
    const dy = y - (atas + h / 2)
    const a = (-t.r * Math.PI) / 180
    const c = Math.cos(a)
    const s = Math.sin(a)
    const dpr = DPR()
    return [(w / 2 + dx * c - dy * s) * dpr, (h / 2 + dx * s + dy * c) * dpr]
  }

  /** semua kanvas sketsa ini (figur dan goresan) */
  get semuaKanvas() {
    return this.figurKanvas ? [this.figurKanvas, this.kanvas] : [this.kanvas]
  }
}

/** gambar ops langsung ke sebuah kanvas, penuh, dengan lebar CSS tertentu (untuk dialog) */
export function gambarKe(
  kanvas: HTMLCanvasElement,
  ops: Op[],
  id: string,
  tema: Tema,
  lebarCss?: number,
) {
  const l = lapisan(ops, hashTeks(id))
  const b = batasGoresan(l.goresan)
  const skala = lebarCss ? lebarCss / b.w : 1
  const dpr = DPR()
  kanvas.width = Math.max(1, Math.ceil(b.w * skala * dpr))
  kanvas.height = Math.max(1, Math.ceil(b.h * skala * dpr))
  kanvas.style.width = b.w * skala + 'px'
  kanvas.style.height = b.h * skala + 'px'
  const ctx = kanvas.getContext('2d')!
  ctx.clearRect(0, 0, kanvas.width, kanvas.height)
  gambarLapisanSampai(l, l.total, { ctx, skala: skala * dpr, x0: b.x, y0: b.y }, tema)
}
