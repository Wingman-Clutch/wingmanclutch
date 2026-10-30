// Hujan karakter ala Matrix. Di tema matrix jatuh di belakang sketsa; di kertas biasa hanya
// terlihat di bawah sudut halaman yang dikupas.

import { GERAK_DIKURANGI, kaitkan } from '../engine/animasi'
import { DPR } from '../engine/sketsa'

const HURUF = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789WINGMANCLUTCH<>/{}=+*'

export class Hujan {
  private ctx: CanvasRenderingContext2D
  private kolom: { y: number; v: number; panjang: number }[] = []
  private ukuranHuruf = 16
  private jalan = false
  private lalu = 0

  constructor(private kanvas: HTMLCanvasElement) {
    this.ctx = kanvas.getContext('2d')!
  }

  /** siapkan kolom sesuai ukuran kanvas */
  atur(ukuranHuruf = 16) {
    const dpr = DPR()
    const w = this.kanvas.clientWidth
    const h = this.kanvas.clientHeight
    this.kanvas.width = Math.ceil(w * dpr)
    this.kanvas.height = Math.ceil(h * dpr)
    this.ukuranHuruf = ukuranHuruf
    const n = Math.ceil(w / ukuranHuruf)
    this.kolom = Array.from({ length: n }, () => ({
      y: Math.random() * (h / ukuranHuruf) * 1.4 - 10,
      v: 6 + Math.random() * 12,
      panjang: 8 + Math.floor(Math.random() * 18),
    }))
    this.gambar()
  }

  private gambar() {
    const g = this.ctx
    const dpr = DPR()
    const s = this.ukuranHuruf
    const h = this.kanvas.clientHeight
    g.setTransform(dpr, 0, 0, dpr, 0, 0)
    g.clearRect(0, 0, this.kanvas.clientWidth, h)
    g.font = `${s * 0.86}px ui-monospace, "SFMono-Regular", Menlo, monospace`
    g.textAlign = 'center'
    this.kolom.forEach((k, i) => {
      const x = i * s + s / 2
      const kepala = Math.floor(k.y)
      for (let j = 0; j < k.panjang; j++) {
        const baris = kepala - j
        const y = baris * s
        if (y < -s || y > h + s) continue
        const kunci = (i * 31 + baris * 17) % HURUF.length
        const ganti =
          Math.random() < 0.03 ? Math.floor(Math.random() * HURUF.length) : Math.abs(kunci)
        g.fillStyle =
          j === 0
            ? 'rgba(200, 255, 220, 0.6)'
            : `rgba(40, 230, 110, ${(0.42 * (1 - j / k.panjang)).toFixed(3)})`
        g.fillText(HURUF[ganti], x, y)
      }
    })
  }

  mulai() {
    if (this.jalan || GERAK_DIKURANGI) return
    this.jalan = true
    this.lalu = 0
    kaitkan((t, dt) => {
      if (!this.jalan) return false
      const h = this.kanvas.clientHeight / this.ukuranHuruf
      for (const k of this.kolom) {
        k.y += k.v * dt
        if (k.y - k.panjang > h) {
          k.y = -Math.random() * 10
          k.v = 6 + Math.random() * 12
        }
      }
      // cukup 30 kali per detik
      if (t - this.lalu > 33) {
        this.lalu = t
        this.gambar()
      }
    })
  }

  berhenti() {
    this.jalan = false
  }
}
