// Sketsa = satu gambar di kanvasnya sendiri. Bisa digambar sedikit demi sedikit (progres 0..1),
// digambar ulang penuh setelah tema atau ukuran berubah, dan punya layar yang berganti-ganti.

import { batasGoresan, kompilasi, type Goresan, type Op } from './goresan'
import { hashTeks } from './acak'
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

export class Sketsa {
  readonly id: string
  readonly el: HTMLElement
  readonly kanvas: HTMLCanvasElement
  readonly ctx: CanvasRenderingContext2D
  private dasar: Lapisan
  private daftarLayar: Lapisan[] = []
  private layarKanvas?: HTMLCanvasElement
  private layarCtx?: CanvasRenderingContext2D
  layarAktif = -1
  batas: { x: number; y: number; w: number; h: number }
  tempat: Penempatan = { x: 0, y: 0, skala: 1, r: 0 }
  progres = 0
  private tema: Tema = 'terang'

  constructor(id: string, ops: Op[], layar: Op[][] = [], el?: HTMLElement) {
    this.id = id
    const benih = hashTeks(id)
    this.dasar = lapisan(ops, benih)
    this.daftarLayar = layar.map((l, i) => lapisan(l, benih + 101 * (i + 1)))
    const semua = [...this.dasar.goresan, ...this.daftarLayar.flatMap((l) => l.goresan)]
    this.batas = batasGoresan(semua)
    this.el = el ?? document.createElement('div')
    this.el.classList.add('sketsa')
    this.el.dataset.sketsa = id
    this.kanvas = document.createElement('canvas')
    this.kanvas.setAttribute('aria-hidden', 'true')
    this.el.appendChild(this.kanvas)
    this.ctx = this.kanvas.getContext('2d')!
    if (layar.length) {
      this.layarKanvas = document.createElement('canvas')
      this.layarKanvas.className = 'layar'
      this.layarKanvas.setAttribute('aria-hidden', 'true')
      this.el.appendChild(this.layarKanvas)
      this.layarCtx = this.layarKanvas.getContext('2d')!
    }
  }

  get jumlahLayar() {
    return this.daftarLayar.length
  }

  private kanvasInfo(ctx: CanvasRenderingContext2D): Kanvas {
    return { ctx, skala: this.tempat.skala * DPR(), x0: this.batas.x, y0: this.batas.y }
  }

  /** pasang posisi dan ukuran; kanvas dibuat ulang dan isinya digambar lagi sampai progresnya */
  tempatkan(t: Penempatan, tema: Tema) {
    this.tempat = t
    this.tema = tema
    const lebar = this.batas.w * t.skala
    const tinggi = this.batas.h * t.skala
    const dpr = DPR()
    for (const c of [this.kanvas, this.layarKanvas]) {
      if (!c) continue
      c.width = Math.max(1, Math.ceil(lebar * dpr))
      c.height = Math.max(1, Math.ceil(tinggi * dpr))
      c.style.width = lebar + 'px'
      c.style.height = tinggi + 'px'
    }
    Object.assign(this.el.style, {
      left: t.x + this.batas.x * t.skala + 'px',
      top: t.y + this.batas.y * t.skala + 'px',
      width: lebar + 'px',
      height: tinggi + 'px',
      rotate: t.r + 'deg',
    })
    this.gambarUlang()
  }

  /** ganti tema tanpa mengubah posisi */
  warnai(tema: Tema) {
    this.tema = tema
    this.gambarUlang()
  }

  private gambarUlang() {
    this.ctx.clearRect(0, 0, this.kanvas.width, this.kanvas.height)
    const p = this.progres
    kosongkan(this.dasar)
    this.progres = 0
    if (p > 0) this.gambar(p)
    if (this.layarCtx && this.layarAktif >= 0) {
      const l = this.daftarLayar[this.layarAktif]
      const sudah = l.tergambar
      this.layarCtx.clearRect(0, 0, this.layarKanvas!.width, this.layarKanvas!.height)
      kosongkan(l)
      gambarLapisanSampai(l, sudah, this.kanvasInfo(this.layarCtx), this.tema)
    }
  }

  /** gambar sampai progres p (0..1); hanya bagian yang belum tergambar yang ditambahkan */
  gambar(p: number) {
    if (p <= this.progres) return
    this.progres = p
    gambarLapisanSampai(this.dasar, this.dasar.total * p, this.kanvasInfo(this.ctx), this.tema)
  }

  /** kosongkan kanvas dan mulai dari nol */
  ulang() {
    this.progres = 0
    kosongkan(this.dasar)
    this.ctx.clearRect(0, 0, this.kanvas.width, this.kanvas.height)
    this.hapusLayar()
    this.layarAktif = -1
  }

  hapusLayar() {
    if (!this.layarCtx) return
    this.layarCtx.clearRect(0, 0, this.layarKanvas!.width, this.layarKanvas!.height)
    for (const l of this.daftarLayar) kosongkan(l)
  }

  /** mulai layar ke-i dari nol; kembalikan fungsi progres untuk digambar bertahap */
  pilihLayar(i: number) {
    this.hapusLayar()
    this.layarAktif = i
    const l = this.daftarLayar[i]
    return (p: number) => {
      if (this.layarAktif !== i || !this.layarCtx) return
      gambarLapisanSampai(l, l.total * p, this.kanvasInfo(this.layarCtx), this.tema)
    }
  }

  /** ubah titik layar (piksel CSS relatif papan) ke koordinat piksel kanvas sketsa */
  keKanvas(x: number, y: number): [number, number] {
    const t = this.tempat
    const kiri = t.x + this.batas.x * t.skala
    const atas = t.y + this.batas.y * t.skala
    const w = this.batas.w * t.skala
    const h = this.batas.h * t.skala
    const dx = x - (kiri + w / 2)
    const dy = y - (atas + h / 2)
    const a = (-t.r * Math.PI) / 180
    const c = Math.cos(a)
    const s = Math.sin(a)
    const dpr = DPR()
    return [(w / 2 + dx * c - dy * s) * dpr, (h / 2 + dx * s + dy * c) * dpr]
  }

  /** semua kanvas sketsa ini (dasar dan layar) */
  get semuaKanvas() {
    return this.layarKanvas ? [this.kanvas, this.layarKanvas] : [this.kanvas]
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
