// Lanyard di dialog tim: setiap kartu nama tergantung dari tali bercetak yang ujung atasnya
// ditempel selotip ke kertas. Tali adalah simpul Verlet (engine/tali.ts) yang digambar sebagai pita
// bertekstur di satu kanvas; kartunya elemen HTML yang diputar 3D dengan CSS, jadi kedua sisinya
// bisa berisi apa saja. Seret kartu dan talinya menegang, lempar ke samping dan kartu berputar di
// cincinnya, ketuk (atau Enter/Spasi) untuk membaliknya.
// Ditulis ulang tanpa React dari komponen yang diberikan Kall; mandala di talinya diganti lambang dan
// tulisan Wingman Clutch.

/*!
 * Fisika tali, tekstur tali, dan kartu 3D di berkas ini dan di engine/tali.ts diadaptasi dari
 * Lanyard Badge karya Kedhareswer Naidu (https://21st.dev/@kedhareswer/components/lanyard-badge).
 *
 * MIT License
 *
 * Copyright (c) Kedhareswer Naidu
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software
 * and associated documentation files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or
 * substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
 * BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import { GERAK_DIKURANGI, kaitkan } from '../engine/animasi'
import { DPR } from '../engine/sketsa'
import { isiLambang, RASIO_LAMBANG } from './merek'
import { BUNYI, suara } from './suara'
import {
  langkahPutar,
  langkahVerlet,
  sudutAyun,
  tegangkan,
  type Putaran,
  type Sambungan,
  type Simpul,
} from '../engine/tali'

export interface GayaTali {
  /** warna tali */
  warna: string
  /** warna cetakan di tali */
  tinta: string
  /** tulisan sambung yang dicetak di sepanjang tali */
  teks: string
  /** label tegak di antara tulisan sambung */
  label: string
}

const LANGKAH = 1 / 120
const GRAVITASI = 2400
const ULANG = 18
/** ruas setiap untai, dari selotip sampai gesper */
const RUAS = 14
/** ruang kosong di bawah kartu yang tergantung diam, cukup untuk bayangannya */
const BAWAH = 30
const LABEL = '"Special Elite", "Courier New", monospace'
const SKRIP = '"Segoe Script", "Snell Roundhand", "Brush Script MT", cursive'

/** lebar kartu (px) supaya n kartu muat berjejer di panggung selebar x setinggi ini */
export function lebarKartu(lebar: number, tinggi: number, n: number) {
  const atas = Math.max(tinggi * 0.16, 40)
  // dari gesper ke bawah: tali pendek, cincin, jepit, dan kartu setinggi 1,5 kali lebarnya
  const muatTinggi = (tinggi - BAWAH - atas) / 1.9
  return Math.round(Math.max(80, Math.min(190, (lebar / n) * 0.72, muatTinggi)))
}

/** tekstur tali sepanjang `panjang` px css, membujur sepanjang tinggi kanvas, dalam piksel layar */
function buatTekstur(panjang: number, lebar: number, dpr: number, g: GayaTali, polos = false) {
  const c = document.createElement('canvas')
  c.width = Math.max(1, Math.round(lebar * dpr))
  c.height = Math.max(1, Math.round(panjang * dpr))
  const ctx = c.getContext('2d')!
  // ruang tali: x menyusuri tali, y melintang
  ctx.setTransform(0, dpr, -dpr, 0, c.width, 0)
  ctx.fillStyle = g.warna
  ctx.fillRect(0, 0, panjang, lebar)
  ctx.strokeStyle = ctx.fillStyle = g.tinta

  if (!polos) {
    ctx.save()
    ctx.beginPath()
    ctx.rect(0, 0, panjang, lebar)
    ctx.clip()
    ctx.textBaseline = 'middle'
    const hurufSkrip = `400 ${Math.round(lebar * 0.5)}px ${SKRIP}`
    const hurufLabel = `400 ${Math.round(lebar * 0.4)}px ${LABEL}`
    ctx.font = hurufSkrip
    const lebarSkrip = ctx.measureText(g.teks).width
    ctx.font = hurufLabel
    const label = `·  ${g.label}  ·`
    const lebarLabel = ctx.measureText(label).width
    const jeda = lebar * 0.6
    const tinggiLambang = lebar * 0.64
    let x = lebar * 0.4
    while (x < panjang) {
      // cetakan berulang: lambang Wingman Clutch, semboyan, lalu label
      ctx.globalAlpha = 0.95
      isiLambang(ctx, x, (lebar - tinggiLambang) / 2, tinggiLambang)
      x += tinggiLambang * RASIO_LAMBANG + jeda
      ctx.font = hurufSkrip
      ctx.fillText(g.teks, x, lebar * 0.52)
      x += lebarSkrip + jeda
      ctx.font = hurufLabel
      ctx.fillText(label, x, lebar * 0.54)
      x += lebarLabel + jeda
    }
    ctx.restore()
  }

  // tepi anyaman sedikit menangkap cahaya
  ctx.globalAlpha = 0.35
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(0, 1.5)
  ctx.lineTo(panjang, 1.5)
  ctx.moveTo(0, lebar - 1.5)
  ctx.lineTo(panjang, lebar - 1.5)
  ctx.stroke()
  return c
}

interface Tarik {
  id: number
  ox: number
  oy: number
  tx: number
  ty: number
  sx: number
  sy: number
  geser: boolean
}

interface Gantungan {
  kartu: HTMLElement
  /** tombol balik di atas kartu, pemegang aria-pressed */
  tombol: HTMLElement
  isi: HTMLElement
  selotip: HTMLElement
  simpul: Simpul[]
  sambungan: Sambungan[]
  kiri: number[]
  kanan: number[]
  pendek: number[]
  /** gesper, cincin, dan pusat massa kartu */
  iG: number
  iC: number
  iK: number
  diamUntai: number
  putar: Putaran
  sasaran: number
  tarik: Tarik | null
  /** kapan seretan terakhir dilepas, supaya klik sesudahnya tidak membalik kartu */
  diseretPada: number
  /** geser fase angin supaya kartu tidak bergerak kembar */
  fase: number
}

export class Lanyard {
  private kanvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private gantungan: Gantungan[]
  private W = 0
  private H = 0
  private dpr = 1
  private kw = 0
  private rc = 0
  private sw = 0
  private pendek = 0
  private tekstur?: HTMLCanvasElement
  private teksturPolos?: HTMLCanvasElement
  private sisa = 0
  private waktu = 0
  private cabut?: () => void
  private amati: ResizeObserver
  private atas = 0

  constructor(
    private panggung: HTMLElement,
    kartu: HTMLElement[],
    private gaya: GayaTali,
    /** dipanggil setelah ukuran kartu dihitung ulang */
    private saatUkur?: (lebarKartu: number) => void,
  ) {
    this.kanvas = document.createElement('canvas')
    this.kanvas.className = 'tali'
    this.kanvas.setAttribute('aria-hidden', 'true')
    panggung.prepend(this.kanvas)
    this.ctx = this.kanvas.getContext('2d')!
    this.gantungan = kartu.map((k, i) => {
      const selotip = document.createElement('span')
      selotip.className = 'selotip-tali'
      selotip.setAttribute('aria-hidden', 'true')
      panggung.append(selotip)
      const g: Gantungan = {
        kartu: k,
        tombol: k.querySelector<HTMLElement>('[aria-pressed]') ?? k,
        isi: k.querySelector<HTMLElement>('.isi')!,
        selotip,
        simpul: [],
        sambungan: [],
        kiri: [],
        kanan: [],
        pendek: [],
        iG: 0,
        iC: 0,
        iK: 0,
        diamUntai: 1,
        putar: { a: 0, v: 0 },
        sasaran: 0,
        tarik: null,
        diseretPada: -Infinity,
        fase: i * 2.1,
      }
      this.pasangTangan(g)
      return g
    })
    this.amati = new ResizeObserver(() => {
      if (!this.cabut) return
      if (
        Math.abs(panggung.clientWidth - this.W) < 1 &&
        Math.abs(panggung.clientHeight - this.H) < 1
      )
        return
      this.bangun(false)
      this.gambar()
      this.tempatkan()
    })
  }

  /** bangun ulang dan jalankan; kartu masuk sambil berayun kecuali gerak dikurangi */
  mulai() {
    if (this.cabut) return
    this.bangun(!GERAK_DIKURANGI)
    this.gambar()
    this.tempatkan()
    // kartu baru terlihat setelah punya tempat; sebelum itu semuanya di pojok kiri atas
    this.panggung.classList.add('siap')
    this.amati.observe(this.panggung)
    this.cabut = kaitkan((_, dt) => this.detak(dt))
    // huruf label baru siap setelah font halaman termuat
    void document.fonts?.ready.then(() => {
      if (!this.cabut) return
      this.buatTeksturTali()
      this.gambar()
    })
  }

  /** ganti warna tali, misalnya saat tema berganti */
  warnai(gaya: GayaTali) {
    if (gaya.warna === this.gaya.warna && gaya.tinta === this.gaya.tinta) return
    this.gaya = gaya
    if (!this.gantungan[0]?.simpul.length) return
    this.buatTeksturTali()
    this.gambar()
  }

  berhenti() {
    this.cabut?.()
    this.cabut = undefined
    this.amati.disconnect()
    for (const g of this.gantungan) g.tarik = null
  }

  /** balik kartu ke-i */
  balik(i: number) {
    const g = this.gantungan[i]
    g.sasaran = g.sasaran === 0 ? Math.PI : 0
    g.tombol.setAttribute('aria-pressed', String(g.sasaran !== 0))
    // kalau loop sedang tidur (dialog tertutup), sudutnya langsung dipasang
    if (!this.cabut) {
      g.putar.a = g.sasaran
      this.tempatkan()
    }
  }

  private pusat(i: number) {
    const n = this.gantungan.length
    const jarak = this.kw * 1.3
    return this.W / 2 + (i - (n - 1) / 2) * jarak
  }

  private bangun(masukBerayun: boolean) {
    const p = this.panggung
    this.dpr = DPR()
    this.W = Math.max(1, p.clientWidth)
    this.H = Math.max(1, p.clientHeight)
    this.kanvas.width = Math.round(this.W * this.dpr)
    this.kanvas.height = Math.round(this.H * this.dpr)

    const n = this.gantungan.length
    const kw = (this.kw = lebarKartu(this.W, this.H, n))
    const kt = Math.round(kw * 1.5)
    const rc = (this.rc = Math.max(7, Math.round(kw * 0.036)))
    const jp = Math.round(kw * 0.1)
    const sw = (this.sw = Math.max(12, Math.round(kw * 0.1)))
    const pendek = (this.pendek = sw * 2.2)
    const lengan = rc * 2 + jp + kt * 0.55
    p.style.setProperty('--kw', kw + 'px')
    p.style.setProperty('--kt', kt + 'px')
    p.style.setProperty('--cincin', rc + 'px')
    p.style.setProperty('--jepit', jp + 'px')

    const tinggiGantung = pendek + rc * 2 + jp + kt
    const yG = Math.max(this.H * 0.16, Math.min(this.H * 0.42, this.H - tinggiGantung - BAWAH))
    const rentang = Math.min(this.W / n / 4, kw * 0.45)
    this.atas = -sw * 2

    this.gantungan.forEach((g, i) => {
      const cx = this.pusat(i)
      const s: Simpul[] = (g.simpul = [])
      const sb: Sambungan[] = (g.sambungan = [])
      const tambah = (x: number, y: number, w: number) => s.push({ x, y, px: x, py: y, w }) - 1
      const untai = (dari: number, ke: number, ruas: number, kendur: number) => {
        const a = s[dari]
        const b = s[ke]
        const diam = (Math.hypot(b.x - a.x, b.y - a.y) * kendur) / ruas
        const id = [dari]
        for (let k = 1; k < ruas; k++)
          id.push(tambah(a.x + ((b.x - a.x) * k) / ruas, a.y + ((b.y - a.y) * k) / ruas, 1))
        id.push(ke)
        for (let k = 0; k < ruas; k++) sb.push([id[k], id[k + 1], diam])
        return { id, diam }
      }
      const aKiri = tambah(cx - rentang, this.atas, 0)
      g.iG = tambah(cx, yG, 1.4)
      const kiri = untai(aKiri, g.iG, RUAS, 1.03)
      const aKanan = tambah(cx + rentang, this.atas, 0)
      const kanan = untai(aKanan, g.iG, RUAS, 1.03)
      g.iC = tambah(cx, yG + pendek, 0.8)
      const bawah = untai(g.iG, g.iC, 3, 1)
      g.iK = tambah(cx, yG + pendek + lengan, 0.25)
      sb.push([g.iC, g.iK, lengan])
      g.kiri = kiri.id
      g.kanan = kanan.id
      g.pendek = bawah.id
      g.diamUntai = kiri.diam
      g.putar = { a: g.sasaran, v: 0 }

      Object.assign(g.selotip.style, {
        left: cx - rentang - sw * 1.2 + 'px',
        width: rentang * 2 + sw * 2.4 + 'px',
        rotate: `${i % 2 ? 3 : -3}deg`,
      })

      if (masukBerayun) {
        // masuk di tengah ayunan, seperti baru saja dilepas tangan
        const arah = i % 2 ? -1 : 1
        s[g.iK].x += kw * 0.35 * arah
        s[g.iK].px = s[g.iK].x - 2 * arah
        g.putar.v = 5 * arah
      } else {
        for (let k = 0; k < 900; k++) {
          langkahVerlet(s, LANGKAH, GRAVITASI, 0.98)
          tegangkan(s, sb, ULANG)
        }
      }
    })
    this.buatTeksturTali()
    this.saatUkur?.(kw)
  }

  private buatTeksturTali() {
    const g = this.gantungan[0]
    if (!g) return
    this.tekstur = buatTekstur(g.diamUntai * RUAS + 4, this.sw, this.dpr, this.gaya)
    this.teksturPolos = buatTekstur(this.pendek + 4, this.sw * 0.8, this.dpr, this.gaya, true)
  }

  private detak(dt: number) {
    this.sisa += dt
    let langkah = 0
    while (this.sisa >= LANGKAH && langkah < 8) {
      this.sisa -= LANGKAH
      langkah++
      this.waktu += LANGKAH
      const t = this.waktu
      for (const g of this.gantungan) {
        const s = g.simpul
        const C = s[g.iC]
        const K = s[g.iK]
        if (g.tarik) {
          C.px = C.x
          C.py = C.y
          C.x += (g.tarik.tx - C.x) * 0.35
          C.y += (g.tarik.ty - C.y) * 0.35
        } else if (!GERAK_DIKURANGI) {
          // angin di ruangan, supaya kartu tidak pernah benar-benar diam
          K.x +=
            (22 * Math.sin(t * 0.7 + g.fase) + 12 * Math.sin(t * 1.9 + g.fase * 1.3)) *
            LANGKAH *
            LANGKAH
        }
        langkahVerlet(s, LANGKAH, GRAVITASI, 0.992)
        tegangkan(s, g.sambungan, ULANG)
        const vx = (K.x - K.px) / LANGKAH
        const angin = GERAK_DIKURANGI ? 0 : 0.6 * Math.sin(t * 0.5 + g.fase)
        langkahPutar(g.putar, g.sasaran, LANGKAH, vx * 0.03 + angin)
      }
    }
    this.gambar()
    this.tempatkan()
  }

  /** satu untai sebagai pita: setiap ruas mengambil irisan teksturnya sendiri */
  private pita(
    g: Gantungan,
    id: number[],
    tekstur: HTMLCanvasElement,
    diam: number,
    cahaya: number,
  ) {
    const { ctx, dpr } = this
    const s = g.simpul
    const Wt = tekstur.width
    for (let i = 0; i < id.length - 1; i++) {
      const a = s[id[i]]
      const b = s[id[i + 1]]
      const dx = (b.x - a.x) * dpr
      const dy = (b.y - a.y) * dpr
      const pjg = Math.hypot(dx, dy) || 1e-6
      const tx = dx / pjg
      const ty = dy / pjg
      // pasangan ini membuat cetakan terbaca, tidak tercermin
      const nx = ty
      const ny = -tx
      const v0 = i * diam * dpr
      const dv = diam * dpr
      const k = pjg / dv
      ctx.setTransform(
        nx,
        ny,
        tx * k,
        ty * k,
        a.x * dpr - (nx * Wt) / 2 - tx * k * v0,
        a.y * dpr - (ny * Wt) / 2 - ty * k * v0,
      )
      // +1,5 menindih irisan berikutnya supaya tekukan tidak menampakkan garis
      const sumber = Math.min(dv + 1.5, tekstur.height - v0)
      if (sumber > 0) ctx.drawImage(tekstur, 0, v0, Wt, sumber, 0, v0, Wt, sumber)
      // untai yang membelakangi cahaya tampak lebih gelap
      const bayang = 0.22 * (1 - Math.max(0, nx * cahaya))
      ctx.fillStyle = `rgba(0,0,0,${bayang.toFixed(3)})`
      ctx.fillRect(0, v0, Wt, dv + 1)
    }
  }

  private logam(x0: number, y0: number, x1: number, y1: number) {
    const g = this.ctx.createLinearGradient(x0, y0, x1, y1)
    g.addColorStop(0, '#f4efe4')
    g.addColorStop(0.45, '#b9b0a0')
    g.addColorStop(0.55, '#8f8778')
    g.addColorStop(1, '#ece6da')
    return g
  }

  private gambar() {
    const { ctx, dpr, sw, rc } = this
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, this.kanvas.width, this.kanvas.height)
    if (!this.tekstur || !this.teksturPolos) return
    for (const g of this.gantungan) {
      this.pita(g, g.kiri, this.tekstur, g.diamUntai, -1)
      this.pita(g, g.kanan, this.tekstur, g.diamUntai, 1)
      this.pita(g, g.pendek, this.teksturPolos, this.pendek / 3, 0)

      // gesper, berputar mengikuti tali pendek
      const G = g.simpul[g.iG]
      const C = g.simpul[g.iC]
      const sudut = Math.atan2(C.x - G.x, C.y - G.y)
      const u = sw / 20
      ctx.setTransform(dpr, 0, 0, dpr, G.x * dpr, G.y * dpr)
      ctx.rotate(-sudut)
      ctx.shadowColor = 'rgba(0,0,0,0.3)'
      ctx.shadowBlur = 6 * dpr
      ctx.shadowOffsetY = 2 * dpr
      ctx.fillStyle = this.logam(-16 * u, 0, 16 * u, 0)
      ctx.beginPath()
      ctx.roundRect(-15 * u, -14 * u, 30 * u, 17 * u, 3 * u)
      ctx.fill()
      ctx.beginPath()
      ctx.roundRect(-11 * u, 1 * u, 22 * u, 15 * u, [2 * u, 2 * u, 6 * u, 6 * u])
      ctx.fill()
      ctx.shadowColor = 'transparent'
      ctx.fillStyle = 'rgba(40,36,30,0.55)'
      ctx.fillRect(-10 * u, -9 * u, 20 * u, 2.2 * u)
      ctx.fillRect(-5 * u, 6 * u, 10 * u, 3 * u)
      ctx.strokeStyle = 'rgba(255,255,255,0.6)'
      ctx.lineWidth = 0.8 * u
      ctx.beginPath()
      ctx.moveTo(-13 * u, -12.5 * u)
      ctx.lineTo(13 * u, -12.5 * u)
      ctx.stroke()

      // cincin belah
      ctx.setTransform(dpr, 0, 0, dpr, C.x * dpr, (C.y + rc * 0.8) * dpr)
      ctx.lineWidth = Math.max(2.5, rc * 0.38)
      ctx.strokeStyle = this.logam(-rc, -rc, rc, rc)
      ctx.beginPath()
      ctx.arc(0, 0, rc, 0, Math.PI * 2)
      ctx.stroke()
    }
  }

  private tempatkan() {
    for (const g of this.gantungan) {
      if (!g.simpul.length) continue
      const C = g.simpul[g.iC]
      const K = g.simpul[g.iK]
      const ayun = sudutAyun(C, K)
      g.kartu.style.transform = `translate3d(${(C.x - this.kw / 2).toFixed(2)}px,${(C.y + this.rc).toFixed(2)}px,0) rotate(${(-ayun).toFixed(4)}rad)`
      g.isi.style.transform = `perspective(1100px) rotateY(${g.putar.a.toFixed(4)}rad)`
      const tepi = 1 - Math.abs(Math.cos(g.putar.a))
      g.isi.style.setProperty('--redup', (tepi * 0.5).toFixed(3))
      g.isi.style.setProperty(
        '--kilap',
        (50 + Math.sin(g.putar.a) * 70 + ayun * 90).toFixed(1) + '%',
      )
    }
  }

  private pasangTangan(g: Gantungan) {
    const k = g.kartu
    const i = () => this.gantungan.indexOf(g)
    const lokal = (e: PointerEvent) => {
      const r = this.panggung.getBoundingClientRect()
      return [e.clientX - r.left, e.clientY - r.top]
    }
    k.addEventListener('pointerdown', (e) => {
      if (e.button > 0 || !g.simpul.length) return
      const [x, y] = lokal(e)
      const C = g.simpul[g.iC]
      g.tarik = {
        id: e.pointerId,
        ox: C.x - x,
        oy: C.y - y,
        tx: C.x,
        ty: C.y,
        sx: x,
        sy: y,
        geser: false,
      }
      C.w = 0
      k.setPointerCapture(e.pointerId)
      k.classList.add('ditarik')
    })
    k.addEventListener('pointermove', (e) => {
      const t = g.tarik
      if (!t || e.pointerId !== t.id) return
      const [x, y] = lokal(e)
      t.tx = x + t.ox
      t.ty = y + t.oy
      if (Math.hypot(x - t.sx, y - t.sy) > 5) t.geser = true
    })
    const lepas = (e: PointerEvent) => {
      const t = g.tarik
      if (!t || e.pointerId !== t.id) return
      if (t.geser) g.diseretPada = performance.now()
      g.tarik = null
      g.simpul[g.iC].w = 0.8
      k.classList.remove('ditarik')
    }
    k.addEventListener('pointerup', lepas)
    k.addEventListener('pointercancel', lepas)
    // ketukan, Enter, dan Spasi di tombol balik semuanya berakhir sebagai klik; klik yang
    // menyusul seretan bukan ketukan
    k.addEventListener('click', () => {
      if (performance.now() - g.diseretPada < 400) return
      this.balik(i())
      suara.mainkan(BUNYI.balikKartu)
    })
  }
}
