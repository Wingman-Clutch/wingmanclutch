// Lampu gantung di pojok halaman: figur Colorfigures yang menyala di kertas terang dan padam di kertas
// gelap, kabel sampai tepi atas layar, dan tali tarik. Tali ditarik sampai saklarnya berbunyi untuk
// berganti tema; klik atau Enter menarik sendiri. Talinya memakai simpul Verlet engine/tali.ts.

import UKURAN from '../data/figur.json'
import { GERAK_DIKURANGI } from '../engine/animasi'
import { langkahVerlet, tegangkan, type Sambungan, type Simpul } from '../engine/tali'
import type { TataLetak, Ukuran } from './tata-letak'

/** seberapa jauh tali bisa ditarik keluar dari saklar, dalam satuan adegan */
export const TARIK_MAKS = 26
/** jari-jari biji di ujung tali, dalam satuan adegan */
export const BIJI = 6.5
const RUAS = 7
/** langkah simulasi tali, detik */
const LANGKAH = 1 / 60
const { w: LEBAR_GAMBAR, h: TINGGI_GAMBAR, titik: TITIK } = UKURAN.lampu

/** saklar berbunyi saat tarikan melewati ambang ini, dan baru bisa berbunyi lagi setelah tali kembali */
export const AMBANG_KLIK = TARIK_MAKS * 0.55
const AMBANG_LEPAS = TARIK_MAKS * 0.15

/**
 * Saklar tarik: `tarik` = panjang tali yang sedang tertarik keluar (satuan adegan). Mengembalikan
 * keadaan berikutnya dan apakah tarikan ini membuat saklar berbunyi.
 */
export function saklar(siap: boolean, tarik: number) {
  if (siap && tarik >= AMBANG_KLIK) return { siap: false, klik: true }
  if (!siap && tarik <= AMBANG_LEPAS) return { siap: true, klik: false }
  return { siap, klik: false }
}

/**
 * Kotak gambar lampu dan jangkauan talinya sampai tarikan penuh (termasuk ayunan ke samping), dalam
 * satuan adegan. Dipakai test tata letak supaya lampu tidak menimpa sketsa.
 */
export function jangkauanLampu(L: TataLetak['lampu']) {
  const tinggi = (L.w * TINGGI_GAMBAR) / LEBAR_GAMBAR
  const x = L.x + TITIK.tali[0] * L.w
  const y = L.y + TITIK.tali[1] * tinggi
  return {
    gambar: { x0: L.x, y0: L.y, x1: L.x + L.w, y1: L.y + tinggi },
    tali: { x0: x - 14, y0: y, x1: x + 14, y1: y + L.tali + TARIK_MAKS + 2 * BIJI },
  }
}

const NS = 'http://www.w3.org/2000/svg'

export class Lampu {
  private readonly el: HTMLElement
  private readonly kabel: HTMLElement
  private readonly badan: HTMLElement
  private readonly gambarNyala: HTMLImageElement
  private readonly gambarMati: HTMLImageElement
  private readonly tinta: SVGPathElement
  private readonly isi: SVGPathElement
  private readonly biji: SVGGElement
  private readonly tombol: HTMLButtonElement
  private readonly padaTarik: () => void
  /** piksel per satuan adegan */
  private k = 1
  /** panjang tali saat diam, satuan adegan */
  private panjang = 60
  /** titik gantung kabel dan cincin tali saat lampu diam, piksel relatif #app */
  private gantung = { x: 0, y: 0 }
  private cincin0 = { x: 0, y: 0 }
  private simpul: Simpul[] = []
  private sambungan: Sambungan[] = []
  /** sudut ayun lampu (radian, searah jarum jam positif) dan kecepatannya */
  private ayun = { a: 0, v: 0 }
  private tarik = 0
  private siap = true
  /**
   * Pointer yang sedang menyeret biji. (dx, dy) = jarak pointer dari biji saat mulai ditekan, `lebih` =
   * tali yang sudah keluar saat dipegang (molor karena beratnya, atau belum masuk dari tarikan
   * sebelumnya). Tarikan dihitung dari situ, jadi tarikan pendek tidak pernah memutar saklar.
   * `berbunyi` = saklar sudah berbunyi selama seretan ini.
   */
  private seret: {
    id: number
    mouse: boolean
    x0: number
    y0: number
    x: number
    y: number
    dx: number
    dy: number
    lebih: number
    bergeser: boolean
    berbunyi: boolean
  } | null = null
  /**
   * Klik yang menyusul seretan tidak dihitung lagi sebagai tarikan kalau saklarnya sudah berbunyi,
   * atau kalau mouse-nya bergeser. Jari yang bergeser sedikit tetap dihitung ketukan, karena browser
   * hanya mengirim klik kalau jarinya hampir diam.
   */
  private abaikanKlik = false
  private otomatis: { t: number } | null = null
  private jalan = 0
  private waktu = 0
  /** waktu simulasi yang belum dijalankan, dan detik sejak tali terakhir dipegang atau ditarik */
  private sisa = 0
  private tenang = 0

  constructor(el: HTMLElement, padaTarik: () => void) {
    this.el = el
    this.padaTarik = padaTarik
    this.kabel = document.createElement('div')
    this.kabel.className = 'kabel'
    this.badan = document.createElement('div')
    this.badan.className = 'badan'
    this.badan.style.transformOrigin = `${TITIK.kabel[0] * 100}% ${TITIK.kabel[1] * 100}%`
    this.gambarNyala = this.gambar('nyala')
    this.gambarMati = this.gambar('mati')
    this.badan.append(this.gambarNyala, this.gambarMati)
    const svg = document.createElementNS(NS, 'svg')
    svg.setAttribute('class', 'tali')
    svg.setAttribute('aria-hidden', 'true')
    this.tinta = document.createElementNS(NS, 'path')
    this.tinta.setAttribute('class', 'tinta')
    this.isi = document.createElementNS(NS, 'path')
    this.isi.setAttribute('class', 'isi')
    this.biji = document.createElementNS(NS, 'g')
    this.biji.setAttribute('class', 'biji')
    this.biji.innerHTML =
      '<circle class="pendar" r="2.2"/><circle class="bola" r="1"/>' +
      '<path class="sisi" d="M-.72 .2A.75 .75 0 0 0 .5 .74A1 1 0 0 1 -.72 .2Z"/>' +
      '<circle class="kilap" cx="-.32" cy="-.36" r=".22"/>'
    svg.append(this.tinta, this.isi, this.biji)
    this.tombol = document.createElement('button')
    this.tombol.type = 'button'
    this.tombol.className = 'tarik'
    el.append(this.kabel, this.badan, svg, this.tombol)
    this.pasangKendali()
    this.warnai(true)
  }

  private gambar(keadaan: 'nyala' | 'mati') {
    const img = document.createElement('img')
    img.src = `/figur/lampu-${keadaan}.webp`
    img.alt = ''
    img.width = LEBAR_GAMBAR
    img.height = TINGGI_GAMBAR
    img.className = keadaan
    img.decoding = 'async'
    return img
  }

  /** nyala di kertas terang, padam di kertas gelap */
  warnai(nyala: boolean) {
    this.el.classList.toggle('padam', !nyala)
    this.tombol.setAttribute('aria-label', nyala ? 'Matikan lampu' : 'Nyalakan lampu')
  }

  /** tempatkan lampu untuk ukuran layar ini; talinya kembali menggantung lurus */
  atur(u: Ukuran) {
    const L = u.L.lampu
    this.k = u.k
    this.panjang = L.tali
    const lebar = L.w * u.k
    const tinggi = (lebar * TINGGI_GAMBAR) / LEBAR_GAMBAR
    const kiri = u.kiri + L.x * u.k
    const atas = u.atas + L.y * u.k
    Object.assign(this.badan.style, {
      left: kiri + 'px',
      top: atas + 'px',
      width: lebar + 'px',
      height: tinggi + 'px',
    })
    this.gantung = { x: kiri + TITIK.kabel[0] * lebar, y: atas + TITIK.kabel[1] * tinggi }
    this.cincin0 = { x: kiri + TITIK.tali[0] * lebar, y: atas + TITIK.tali[1] * tinggi }
    Object.assign(this.kabel.style, {
      left: this.gantung.x + 'px',
      height: this.gantung.y + 2 + 'px',
      width: Math.max(2, 3.4 * u.k) + 'px',
    })
    const ruas = this.panjangRuas()
    const c = this.cincin()
    this.simpul = Array.from({ length: RUAS + 1 }, (_, i) => ({
      x: c.x,
      y: c.y + i * ruas,
      px: c.x,
      py: c.y + i * ruas,
      // cincin dipaku; biji di ujung lebih berat dari ruas tali
      w: i === 0 ? 0 : i === RUAS ? 0.35 : 1,
    }))
    this.sambungan = Array.from({ length: RUAS }, (_, i) => [i, i + 1, ruas] as Sambungan)
    this.ayun = { a: 0, v: 0 }
    this.tarik = 0
    this.gambarTali()
  }

  private panjangRuas() {
    return ((this.panjang + this.tarik) * this.k) / RUAS
  }

  /** cincin tali ikut berayun bersama lampu */
  private cincin() {
    const dx = this.cincin0.x - this.gantung.x
    const dy = this.cincin0.y - this.gantung.y
    const c = Math.cos(this.ayun.a)
    const s = Math.sin(this.ayun.a)
    return { x: this.gantung.x + dx * c - dy * s, y: this.gantung.y + dx * s + dy * c }
  }

  private pasangKendali() {
    const t = this.tombol
    const titik = (e: PointerEvent) => {
      const r = this.el.getBoundingClientRect()
      return { x: e.clientX - r.left, y: e.clientY - r.top }
    }
    t.addEventListener('pointerdown', (e) => {
      if (e.button || GERAK_DIKURANGI) return
      const p = titik(e)
      const b = this.simpul[RUAS]
      const c = this.cincin()
      this.seret = {
        id: e.pointerId,
        mouse: e.pointerType === 'mouse',
        x0: p.x,
        y0: p.y,
        ...p,
        dx: p.x - b.x,
        dy: p.y - b.y,
        lebih: Math.max(0, Math.hypot(b.x - c.x, b.y - c.y) / this.k - this.panjang),
        bergeser: false,
        berbunyi: false,
      }
      this.otomatis = null
      // pegangan baru adalah tarikan baru
      this.tarik = 0
      this.siap = true
      t.setPointerCapture(e.pointerId)
      this.mulai()
    })
    t.addEventListener('pointermove', (e) => {
      const s = this.seret
      if (!s || s.id !== e.pointerId) return
      const p = titik(e)
      s.x = p.x
      s.y = p.y
      if (Math.hypot(p.x - s.x0, p.y - s.y0) > 4) s.bergeser = true
    })
    const lepas = (e: PointerEvent) => {
      const s = this.seret
      if (!s || s.id !== e.pointerId) return
      this.seret = null
      this.abaikanKlik = s.berbunyi || (s.mouse && s.bergeser)
      this.mulai()
    }
    t.addEventListener('pointerup', lepas)
    t.addEventListener('pointercancel', lepas)
    // klik atau ketukan tanpa menyeret, Enter, atau Spasi: tali ditarik sendiri sampai berbunyi
    t.addEventListener('click', (e) => {
      const abaikan = this.abaikanKlik
      this.abaikanKlik = false
      // seretan jari yang panjang tidak disusul klik, jadi Enter dan Spasi (detail 0) selalu dihitung
      if (abaikan && e.detail) return
      if (GERAK_DIKURANGI) {
        this.padaTarik()
        return
      }
      // tarikan otomatis selalu berbunyi, walau tarikan sebelumnya belum kembali masuk
      this.siap = true
      this.tarik = 0
      this.otomatis = { t: 0 }
      this.mulai()
    })
  }

  private mulai() {
    if (this.jalan) return
    // kelas `bergerak` selama tali atau lampu masih berayun (dipakai juga oleh E2E)
    this.el.classList.add('bergerak')
    this.waktu = performance.now()
    this.sisa = 0
    this.tenang = 0
    this.jalan = requestAnimationFrame((t) => this.langkah(t))
  }

  /**
   * Satu frame: simulasi dijalankan dengan langkah tetap (frame rate yang naik turun membuat tali
   * Verlet bergetar), lalu tali digambar. Berhenti saat semuanya diam, atau paling lambat beberapa
   * detik setelah tali terakhir disentuh, supaya halaman tidak terus meminta frame.
   */
  private langkah(sekarang: number) {
    this.sisa += Math.min(0.1, (sekarang - this.waktu) / 1000)
    this.waktu = sekarang
    let n = 0
    for (; this.sisa >= LANGKAH && n < 4; n++) {
      this.simulasi(LANGKAH)
      this.sisa -= LANGKAH
    }
    // tab yang tertinggal jauh tidak dikejar
    if (n === 4) this.sisa = 0
    this.gambarTali()
    const gerak = this.simpul.reduce((t, p) => t + Math.abs(p.x - p.px) + Math.abs(p.y - p.py), 0)
    const bebas = !this.seret && !this.otomatis
    const diam =
      bebas &&
      ((this.tarik < 0.05 &&
        Math.abs(this.ayun.a) < 0.001 &&
        Math.abs(this.ayun.v) < 0.004 &&
        gerak < 0.15) ||
        this.tenang > 6)
    if (!diam) {
      this.jalan = requestAnimationFrame((t) => this.langkah(t))
      return
    }
    // berhenti: simpul dikunci di tempatnya supaya tidak membawa sisa kecepatan ke tarikan berikutnya
    for (const p of this.simpul) {
      p.px = p.x
      p.py = p.y
    }
    this.ayun.v = 0
    this.jalan = 0
    this.siap = true
    this.el.classList.remove('bergerak')
  }

  private simulasi(dt: number) {
    const k = this.k
    // panjang tali yang tertarik keluar: dari seberapa jauh biji dibawa turun saat diseret, dari
    // jadwal saat otomatis, dan kembali masuk sendiri setelah dilepas
    const c = this.cincin()
    const ujung = this.simpul[RUAS]
    if (this.seret) {
      const s = this.seret
      // ayunan lampu tidak ikut dihitung sebagai tarikan
      this.tarik = Math.min(TARIK_MAKS, Math.max(0, (s.y - s.y0) / k))
      const dx = s.x - s.dx - c.x
      const dy = Math.max(s.y - s.dy - c.y, 1)
      const jauh = Math.hypot(dx, dy)
      const f = Math.min(1, ((this.panjang + s.lebih + TARIK_MAKS) * k) / jauh)
      ujung.x = ujung.px = c.x + dx * f
      ujung.y = ujung.py = c.y + dy * f
    } else if (this.otomatis) {
      this.otomatis.t += dt
      const p = this.otomatis.t / 0.14
      this.tarik = TARIK_MAKS * Math.min(1, p)
      if (p >= 1.6) this.otomatis = null
    } else {
      this.tarik += (0 - this.tarik) * Math.min(1, dt * 16)
    }
    this.tenang = this.seret || this.otomatis ? 0 : this.tenang + dt
    const s = saklar(this.siap, this.tarik)
    this.siap = s.siap
    if (s.klik) {
      if (this.seret) this.seret.berbunyi = true
      this.padaTarik()
      this.ayun.v -= 0.6
    }
    // lampu condong ke sisi cincin selama talinya tertarik, lalu berayun kembali
    const condong = -0.11 * (this.tarik / TARIK_MAKS)
    this.ayun.v += ((condong - this.ayun.a) * 26 - this.ayun.v * 3.6) * dt
    this.ayun.a += this.ayun.v * dt
    const cincin = this.cincin()
    const s0 = this.simpul[0]
    s0.x = s0.px = cincin.x
    s0.y = s0.py = cincin.y
    ujung.w = this.seret ? 0 : 0.35
    const ruas = this.panjangRuas()
    for (const sb of this.sambungan) sb[2] = ruas
    // dilepas: goyangan tali cepat reda supaya animasinya berhenti dan halaman kembali diam
    langkahVerlet(this.simpul, dt, 2600 * k, this.seret ? 0.985 : 0.972)
    tegangkan(this.simpul, this.sambungan, 14)
  }

  private gambarTali() {
    this.badan.style.rotate = this.ayun.a + 'rad'
    const p = this.simpul
    let d = `M${p[0].x.toFixed(1)} ${p[0].y.toFixed(1)}`
    for (let i = 1; i < p.length - 1; i++) {
      const mx = (p[i].x + p[i + 1].x) / 2
      const my = (p[i].y + p[i + 1].y) / 2
      d += `Q${p[i].x.toFixed(1)} ${p[i].y.toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`
    }
    const b = p[p.length - 1]
    d += `L${b.x.toFixed(1)} ${b.y.toFixed(1)}`
    this.tinta.setAttribute('d', d)
    this.isi.setAttribute('d', d)
    const k = this.k
    this.tinta.style.strokeWidth = Math.max(2.6, 3.4 * k) + 'px'
    this.isi.style.strokeWidth = Math.max(1.2, 1.7 * k) + 'px'
    const r = BIJI * k
    this.biji.setAttribute(
      'transform',
      `translate(${b.x.toFixed(1)} ${(b.y + r).toFixed(1)}) scale(${r.toFixed(2)})`,
    )
    // area ketuk minimal 44 px di sekitar biji
    const sisi = Math.max(44, r * 4.4)
    Object.assign(this.tombol.style, {
      left: b.x - sisi / 2 + 'px',
      top: b.y + r - sisi / 2 + 'px',
      width: sisi + 'px',
      height: sisi + 'px',
    })
  }
}
