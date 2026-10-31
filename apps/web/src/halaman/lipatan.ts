// Sudut kanan atas halaman sedikit terlipat. Tarik sudutnya (atau ketuk) dan halaman terkelupas:
// di baliknya ada Matrix. Kupas lagi dari dalam Matrix untuk kembali ke kertas.

import { batasi } from '../engine/acak'
import { GERAK_DIKURANGI, kaitkan } from '../engine/animasi'
import type { Titik } from '../engine/jalur'
import { Hujan } from './hujan'
import { BUNYI, suara } from './suara'

/** bagian poligon yang memenuhi f(q) >= 0 */
export function potongPoligon(poligon: Titik[], f: (q: Titik) => number): Titik[] {
  const hasil: Titik[] = []
  poligon.forEach((a, i) => {
    const b = poligon[(i + 1) % poligon.length]
    const fa = f(a)
    const fb = f(b)
    if (fa >= 0) hasil.push(a)
    if (fa >= 0 !== fb >= 0) {
      const t = fa / (fa - fb)
      hasil.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t])
    }
  })
  return hasil
}

/**
 * Lipatan saat sudut (W, 0) ditarik ke titik P: garis lipat adalah sumbu antara keduanya.
 * `terbuka` = bagian halaman yang terangkat (memperlihatkan yang di bawah),
 * `balik` = punggung halaman yang terlipat menutupi halaman.
 */
export function hitungLipatan(W: number, H: number, P: Titik) {
  const vx = P[0] - W
  const vy = P[1]
  const L = Math.hypot(vx, vy)
  if (L < 0.5) return { terbuka: [] as Titik[], balik: [] as Titik[] }
  const nx = vx / L
  const ny = vy / L
  const mx = (W + P[0]) / 2
  const my = P[1] / 2
  const sisi = (q: Titik) => -((q[0] - mx) * nx + (q[1] - my) * ny)
  const terbuka = potongPoligon(
    [
      [0, 0],
      [W, 0],
      [W, H],
      [0, H],
    ],
    sisi,
  )
  const balik = terbuka.map<Titik>((q) => {
    const d = (q[0] - mx) * nx + (q[1] - my) * ny
    return [q[0] - 2 * d * nx, q[1] - 2 * d * ny]
  })
  return { terbuka, balik }
}

const keCss = (p: Titik[]) =>
  p.length < 3
    ? 'polygon(100% 0, 100% 0, 100% 0)'
    : `polygon(${p.map((q) => `${q[0].toFixed(1)}px ${q[1].toFixed(1)}px`).join(',')})`

/**
 * Seberapa jauh sudut ditarik saat diam, dalam piksel. Lipatan dan punggungnya tetap di dalam
 * persegi sebesar ini di pojok kanan atas layar.
 */
export function sudutIstirahat(lebar: number, tinggi: number) {
  return batasi(0.06 * Math.min(lebar, tinggi), 30, 58)
}

export class Lipatan {
  private P: Titik = [0, 0]
  private bawah: HTMLElement
  private balik: HTMLElement
  private hujan: Hujan
  private tarik: { id: number; x0: number; y0: number; bergeser: boolean } | null = null
  sibuk = false

  constructor(
    wadah: HTMLElement,
    private tombol: HTMLButtonElement,
    /** dipanggil saat halaman benar-benar terkelupas */
    private kupas: () => void,
    /** boleh dikupas sekarang? (tidak sedang menghapus) */
    private boleh: () => boolean,
  ) {
    this.bawah = wadah.querySelector('.bawah')!
    this.balik = wadah.querySelector('.balik')!
    this.hujan = new Hujan(wadah.querySelector('.hujan-sudut')!)
    tombol.addEventListener('pointerdown', (e) => this.mulaiTarik(e))
    tombol.addEventListener('pointermove', (e) => this.geserTarik(e))
    tombol.addEventListener('pointerup', (e) => this.lepas(e))
    tombol.addEventListener('pointercancel', () => this.kembali())
    tombol.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        this.kupasPenuh()
      }
    })
  }

  private get W() {
    return innerWidth
  }
  private get H() {
    return innerHeight
  }

  private istirahat() {
    return sudutIstirahat(this.W, this.H)
  }

  private posisiIstirahat(): Titik {
    const a = this.istirahat()
    return [this.W - a, a]
  }

  atur() {
    // saat diam, hujan hanya kelihatan di segitiga sudut yang terlipat
    this.hujan.atur(14, this.istirahat())
    this.lipat(this.posisiIstirahat())
  }

  private lipat(P: Titik) {
    this.P = P
    const { terbuka, balik } = hitungLipatan(this.W, this.H, P)
    this.bawah.style.clipPath = keCss(terbuka)
    this.balik.style.clipPath = keCss(balik)
  }

  private mulaiTarik(e: PointerEvent) {
    if (this.sibuk || !this.boleh()) return
    try {
      this.tombol.setPointerCapture(e.pointerId)
    } catch {
      // pointer sudah lepas
    }
    this.tarik = { id: e.pointerId, x0: e.clientX, y0: e.clientY, bergeser: false }
    this.hujan.mulai()
  }

  private geserTarik(e: PointerEvent) {
    const t = this.tarik
    if (!t || t.id !== e.pointerId) return
    if (Math.hypot(e.clientX - t.x0, e.clientY - t.y0) > 4) t.bergeser = true
    if (!t.bergeser) return
    const x = Math.min(this.W - 2, e.clientX)
    const y = Math.max(2, e.clientY)
    this.lipat([x, y])
  }

  private lepas(e: PointerEvent) {
    const t = this.tarik
    if (!t || t.id !== e.pointerId) return
    this.tarik = null
    if (!t.bergeser) return this.kupasPenuh()
    const ditarik = Math.hypot(this.W - this.P[0], this.P[1])
    if (ditarik > this.istirahat() * 2.4 * Math.SQRT2) this.kupasPenuh()
    else this.kembali()
  }

  /** animasikan P dari posisi sekarang ke tujuan */
  private animasi(tujuan: Titik, durasi: number, selesai: () => void) {
    const dari = this.P
    let t0 = -1
    this.sibuk = true
    this.hujan.mulai()
    kaitkan((t) => {
      if (t0 < 0) t0 = t
      const p = GERAK_DIKURANGI ? 1 : batasi((t - t0) / durasi, 0, 1)
      const e = 1 - Math.pow(1 - p, 3)
      this.lipat([dari[0] + (tujuan[0] - dari[0]) * e, dari[1] + (tujuan[1] - dari[1]) * e])
      if (p < 1) return
      this.sibuk = false
      selesai()
      return false
    })
  }

  private kembali() {
    this.animasi(this.posisiIstirahat(), 280, () => this.hujan.berhenti())
  }

  /** kupas sampai lepas, ganti dunia, lalu sudut baru kembali terlipat sedikit */
  kupasPenuh() {
    if (this.sibuk || !this.boleh()) return
    suara.mainkan(BUNYI.kupasSudut)
    this.animasi([-this.W * 1.1, this.H * 2.2], 900, () => {
      this.kupas()
      this.hujan.berhenti()
      this.lipat([this.W, 0])
      this.animasi(this.posisiIstirahat(), 420, () => this.hujan.berhenti())
    })
  }
}
