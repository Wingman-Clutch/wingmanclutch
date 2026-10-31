// Baki di bawah halaman: lima pensil untuk corat-coret di mana saja, dan penghapus yang
// menggosok seluruh halaman lalu membiarkan semua sketsa digambar ulang.

import { buatAcak, batasi } from '../engine/acak'
import { GERAK_DIKURANGI, kaitkan } from '../engine/animasi'
import type { Goresan, KodeWarna } from '../engine/goresan'
import { sampelUlang, type Garis } from '../engine/jalur'
import { gambarRentang, PENSIL, TINTA, type Tema } from '../engine/kuas'
import { DPR } from '../engine/sketsa'
import type { Papan } from './papan'
import { BUNYI, suara } from './suara'
import type { Pensil, Ukuran } from './tata-letak'

const NAMA_PENSIL: Record<Pensil['c'], string> = {
  w: 'pensil grafit',
  r: 'pensil merah',
  b: 'pensil biru',
  g: 'pensil hijau',
  p: 'pensil pink',
}

/** warna sedikit lebih terang (f > 0) atau lebih gelap (f < 0) */
function rona(hex: string, f: number) {
  const n = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
  return `rgb(${n.map((v) => Math.round(f < 0 ? v * (1 + f) : v + (255 - v) * f)).join(',')})`
}

const TEBAL = 18

/**
 * Tulisan cetak di batang pensil sebagai <image> kecil berisi SVG, bukan <text>: sebagai teks,
 * axe menganggapnya isi tombol yang tidak ada di labelnya (label-content-name-mismatch). Kotaknya
 * hanya seukuran tulisan, jadi pensil tetap bukan kandidat Largest Contentful Paint.
 */
function cetak(teks: string, x: number, lebar: number) {
  const kotak = `${x} -3.2 ${lebar} 6.4`
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${kotak}">${teks}</svg>`
  return `<image x="${x}" y="-3.2" width="${lebar}" height="6.4" href="data:image/svg+xml,${encodeURIComponent(svg)}"/>`
}

/** pensil heksagonal dilihat dari samping, ujung runcing di kanan */
export function svgPensil(c: Pensil['c'], panjang: number) {
  const h = TEBAL
  const r = h / 2
  const grafit = c === 'w'
  const badan = grafit ? '#f2c230' : PENSIL[c]
  const isi = grafit ? '#4a4d57' : PENSIL[c]
  const kerucut = h * 2.3
  const ujung = kerucut * 0.32
  const cat = panjang - kerucut
  const karet = grafit ? h * 0.9 : 0
  const ring = grafit ? karet + h * 1.1 : 0
  const id = 'pn-' + c
  const gradasi = (k: string, stop: [number, string][]) =>
    `<linearGradient id="${id}-${k}" x1="0" y1="0" x2="0" y2="1">${stop.map(([o, w]) => `<stop offset="${o}" stop-color="${w}"/>`).join('')}</linearGradient>`
  const tepi = (y0: number, y1: number, d: number) => `Q${cat - d} ${(y0 + y1) / 2} ${cat} ${y1}`
  const lr = (r * ujung) / kerucut
  const teks = `<text x="${ring + 14}" y="1.7" font-size="4.8" font-weight="700" letter-spacing=".7" font-family="ui-sans-serif, system-ui, sans-serif" fill="${grafit ? '#2b2e37' : '#fbefc4'}" opacity="${grafit ? 0.55 : 0.85}">WINGMAN CLUTCH · ${grafit ? 'HB' : 'WARNA'}</text>`
  return (
    `<svg viewBox="0 ${-r - 1} ${panjang} ${h + 2}" aria-hidden="true" focusable="false"><defs>` +
    gradasi('b', [
      [0, rona(badan, 0.32)],
      [0.3, rona(badan, 0.12)],
      [0.3, badan],
      [0.42, rona(badan, 0.3)],
      [0.52, rona(badan, 0.04)],
      [0.72, rona(badan, -0.08)],
      [0.72, rona(badan, -0.26)],
      [1, rona(badan, -0.45)],
    ]) +
    gradasi('k', [
      [0, '#f4dbb2'],
      [0.5, '#e6bb85'],
      [1, '#a5703d'],
    ]) +
    gradasi('i', [
      [0, rona(isi, 0.3)],
      [0.5, rona(isi, -0.05)],
      [1, rona(isi, -0.45)],
    ]) +
    (grafit
      ? gradasi('m', [
          [0, '#80838a'],
          [0.25, '#e2e4e8'],
          [0.4, '#fafafb'],
          [0.62, '#b5b8bd'],
          [1, '#5f626a'],
        ]) +
        gradasi('e', [
          [0, '#f6b3bc'],
          [0.45, '#f9c6cd'],
          [1, '#c55d6e'],
        ])
      : '') +
    '</defs>' +
    (grafit
      ? `<rect x="0" y="${-r + 0.7}" width="${karet + 1}" height="${h - 1.4}" rx="3.6" fill="url(#${id}-e)"/>`
      : '') +
    `<rect x="${Math.max(0, ring - 1)}" y="${-r}" width="${cat - Math.max(0, ring - 1)}" height="${h}" rx="${grafit ? 0 : 1.2}" fill="url(#${id}-b)"/>` +
    (grafit
      ? ''
      : `<rect x="0" y="${-r}" width="1.6" height="${h}" rx=".8" fill="${rona(badan, -0.3)}"/>`) +
    `<path d="M${ring + 1} ${-r / 2}H${cat - 1}M${ring + 1} ${r / 2}H${cat - 1}" stroke="rgba(0,0,0,.15)" stroke-width=".45"/>` +
    cetak(teks, ring + 13, cat - ring - 15) +
    `<path d="M${cat} ${-r}${tepi(-r, -r / 2, 3)}${tepi(-r / 2, r / 2, 6)}${tepi(r / 2, r, 3)}L${panjang} .5L${panjang} -.5Z" fill="url(#${id}-k)"/>` +
    `<path d="M${cat + 2} -3.6L${panjang - ujung} ${-lr * 0.5}M${cat + 3} 2.8L${panjang - ujung} ${lr * 0.4}" stroke="rgba(150,96,46,.3)" stroke-width=".35" fill="none"/>` +
    `<path d="M${panjang - ujung} ${-lr}Q${panjang - ujung - 1.3} 0 ${panjang - ujung} ${lr}L${panjang} .5L${panjang} -.5Z" fill="url(#${id}-i)"/>` +
    (grafit
      ? `<rect x="${karet}" y="${-r - 0.7}" width="${ring - karet}" height="${h + 1.4}" fill="url(#${id}-m)"/>` +
        [0.18, 0.3, 0.7, 0.82]
          .map((f) => {
            const x = karet + (ring - karet) * f
            return `<path d="M${x} ${-r - 0.7}V${r + 0.7}" stroke="rgba(0,0,0,.28)" stroke-width=".55"/><path d="M${x + 0.6} ${-r - 0.7}V${r + 0.7}" stroke="rgba(255,255,255,.6)" stroke-width=".4"/>`
          })
          .join('')
      : '') +
    '</svg>'
  )
}

/** kursor pensil kecil saat corat-coret */
function kursor(c: Pensil['c']) {
  const badan = c === 'w' ? '#f2c230' : PENSIL[c]
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'><g transform='rotate(135 16 16)'>` +
    `<rect x='3' y='12.5' width='19' height='7' rx='1.2' fill='${badan}' stroke='#22252f' stroke-width='1'/>` +
    `<path d='M22 12.5 L29 16 L22 19.5 Z' fill='#e9c08a' stroke='#22252f' stroke-width='1'/>` +
    `<path d='M26.6 14.8 L29 16 L26.6 17.2 Z' fill='${c === 'w' ? '#3b3e48' : PENSIL[c]}'/></g></svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") 7 25, crosshair`
}

interface Coret {
  titik: number[]
  kum: number[]
  panjang: number
  c: KodeWarna
}

interface Remah {
  x: number
  y: number
  vx: number
  vy: number
  umur: number
  hidup: number
  w: number
  h: number
  rot: number
  warna: string
}

export class Baki {
  private pensilEl: HTMLButtonElement[] = []
  private ukuran?: Ukuran
  private tema: Tema = 'terang'
  private mencoret: Pensil['c'] | null = null
  private coretan: Coret[] = []
  private aktif: Coret | null = null
  private ctxCoret: CanvasRenderingContext2D
  private remah: Remah[] = []
  private remahJalan = false
  menghapus = false

  constructor(
    baki: HTMLElement,
    private kanvasCoret: HTMLCanvasElement,
    private kanvasNoda: HTMLCanvasElement,
    private kanvasRemah: HTMLCanvasElement,
    private penghapus: HTMLButtonElement,
    private bar: HTMLElement,
    private papan: Papan,
    /** dipanggil setelah halaman bersih, untuk menggambar ulang */
    private setelahBersih: () => void,
  ) {
    this.ctxCoret = kanvasCoret.getContext('2d')!
    for (const c of ['w', 'r', 'b', 'g', 'p'] as const) {
      const b = document.createElement('button')
      b.type = 'button'
      b.className = 'pensil'
      b.dataset.c = c
      b.setAttribute('aria-label', `Corat-coret pakai ${NAMA_PENSIL[c]}`)
      b.setAttribute('aria-pressed', 'false')
      b.innerHTML = '<span class="tampak"></span>'
      b.addEventListener('click', () => {
        const pilihan = this.mencoret === c ? null : c
        this.pilih(pilihan)
        suara.mainkan(pilihan ? BUNYI.pilihPensil : BUNYI.letakkanPensil)
      })
      baki.insertBefore(b, penghapus)
      this.pensilEl.push(b)
    }
    penghapus.addEventListener('click', () => this.hapusHalaman())
    // pilih(null) juga dipanggil penghapus, jadi bunyinya di sini, bukan di pilih()
    const letakkan = () => {
      this.pilih(null)
      suara.mainkan(BUNYI.letakkanPensil)
    }
    bar.querySelector('button')!.addEventListener('click', letakkan)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.mencoret) letakkan()
    })
    this.pasangCoretan()
  }

  atur(u: Ukuran, tema: Tema) {
    this.ukuran = u
    this.tema = tema
    const { L, k, kiri, atas } = u
    this.pensilEl.forEach((b, i) => {
      const P = L.pensil[i]
      Object.assign(b.style, {
        left: kiri + (P.x - P.panjang / 2) * k + 'px',
        top: atas + (P.y - L.tebalPensil / 2) * k + 'px',
        width: P.panjang * k + 'px',
        height: L.tebalPensil * k + 'px',
        rotate: P.r + 'deg',
      })
      // bayangan selalu jatuh ke kanan bawah layar, apa pun putaran pensilnya
      const a = (-P.r * Math.PI) / 180
      b.style.setProperty('--sx', (2.6 * Math.cos(a) - 4.6 * Math.sin(a)).toFixed(2))
      b.style.setProperty('--sy', (2.6 * Math.sin(a) + 4.6 * Math.cos(a)).toFixed(2))
      if (b.dataset.panjang !== String(P.panjang)) {
        b.firstElementChild!.innerHTML = svgPensil(P.c, P.panjang)
        b.dataset.panjang = String(P.panjang)
      }
    })
    const E = L.penghapus
    Object.assign(this.penghapus.style, {
      left: kiri + (E.x - E.w / 2) * k + 'px',
      top: atas + (E.y - E.h / 2) * k + 'px',
      width: E.w * k + 'px',
      height: E.h * k + 'px',
      rotate: E.r + 'deg',
    })
    for (const c of [this.kanvasCoret, this.kanvasNoda, this.kanvasRemah]) {
      const dpr = DPR()
      const w = Math.ceil(c.clientWidth * dpr)
      const h = Math.ceil(c.clientHeight * dpr)
      if (c.width !== w || c.height !== h) {
        // noda lama ikut hilang saat ukuran berubah; itu tidak apa-apa
        c.width = w
        c.height = h
      }
    }
    this.gambarUlangCoretan()
  }

  warnai(tema: Tema) {
    this.tema = tema
    this.gambarUlangCoretan()
  }

  // ---------- corat-coret ----------

  pilih(c: Pensil['c'] | null) {
    this.mencoret = c
    document.body.classList.toggle('mencoret', !!c)
    for (const b of this.pensilEl) {
      const nyala = b.dataset.c === c
      b.classList.toggle('aktif', nyala)
      b.setAttribute('aria-pressed', String(nyala))
    }
    this.bar.hidden = !c
    if (c) {
      const nama = this.bar.querySelector<HTMLElement>('.nama-pensil')!
      nama.textContent = NAMA_PENSIL[c]
      nama.style.color = c === 'w' ? '' : TINTA[this.tema][c]
      this.kanvasCoret.style.cursor = kursor(c)
    }
  }

  private keAdegan(e: PointerEvent): [number, number] {
    const u = this.ukuran!
    const r = this.kanvasCoret.getBoundingClientRect()
    return [(e.clientX - r.left - u.kiri) / u.k, (e.clientY - r.top - u.atas) / u.k]
  }

  private kanvasInfo() {
    const u = this.ukuran!
    return { ctx: this.ctxCoret, skala: u.k * DPR(), x0: -u.kiri / u.k, y0: -u.atas / u.k }
  }

  private goresanDari(c: Coret): Goresan {
    return { titik: c.titik, kum: c.kum, panjang: c.panjang, lebar: 6.5, warna: c.c, alfa: 1.1 }
  }

  private pasangCoretan() {
    const kc = this.kanvasCoret
    kc.addEventListener('pointerdown', (e) => {
      if (!this.mencoret) return
      e.preventDefault()
      try {
        kc.setPointerCapture(e.pointerId)
      } catch {
        // pointer sudah dilepas sebelum sempat ditangkap
      }
      const [x, y] = this.keAdegan(e)
      this.aktif = { titik: [x, y, x + 0.01, y], kum: [0, 0.01], panjang: 0.01, c: this.mencoret }
      this.coretan.push(this.aktif)
      gambarRentang(this.kanvasInfo(), this.goresanDari(this.aktif), 0, 0.01, TINTA[this.tema])
    })
    kc.addEventListener('pointermove', (e) => {
      const c = this.aktif
      if (!c) return
      const sebelum = c.panjang
      const daftar = e.getCoalescedEvents?.() ?? [e]
      for (const ev of daftar.length ? daftar : [e]) {
        const [x, y] = this.keAdegan(ev)
        const n = c.titik.length
        const d = Math.hypot(x - c.titik[n - 2], y - c.titik[n - 1])
        if (d < 1.2) continue
        c.titik.push(x, y)
        c.panjang += d
        c.kum.push(c.panjang)
      }
      if (c.panjang > sebelum)
        gambarRentang(
          this.kanvasInfo(),
          this.goresanDari(c),
          Math.max(0, sebelum - 0.5),
          c.panjang,
          TINTA[this.tema],
        )
    })
    const selesai = () => {
      this.aktif = null
    }
    kc.addEventListener('pointerup', selesai)
    kc.addEventListener('pointercancel', selesai)
  }

  private gambarUlangCoretan() {
    if (!this.ukuran) return
    this.ctxCoret.clearRect(0, 0, this.kanvasCoret.width, this.kanvasCoret.height)
    for (const c of this.coretan)
      gambarRentang(this.kanvasInfo(), this.goresanDari(c), 0, c.panjang, TINTA[this.tema])
    this.ctxCoret.globalAlpha = 1
  }

  // ---------- penghapus ----------

  private bayangKeNoda() {
    const g = this.kanvasNoda.getContext('2d')!
    const dpr = DPR()
    g.save()
    g.globalCompositeOperation = 'destination-out'
    g.globalAlpha = 0.35
    g.fillRect(0, 0, this.kanvasNoda.width, this.kanvasNoda.height)
    g.restore()
    g.save()
    g.globalAlpha = 0.07
    for (const s of this.papan.terlihat()) {
      const r = s.el.getBoundingClientRect()
      const lebar = s.batas.w * s.tempat.skala
      const tinggi = s.batas.h * s.tempat.skala
      g.save()
      g.translate((r.left + r.width / 2) * dpr, (r.top + r.height / 2) * dpr)
      g.rotate((s.tempat.r * Math.PI) / 180)
      for (const c of s.semuaKanvas)
        g.drawImage(c, (-lebar / 2) * dpr, (-tinggi / 2) * dpr, lebar * dpr, tinggi * dpr)
      g.restore()
    }
    g.globalAlpha = 0.1
    g.drawImage(this.kanvasCoret, 0, 0)
    g.restore()
  }

  hapusHalaman() {
    if (this.menghapus || !this.ukuran) return
    this.menghapus = true
    this.papan.sibuk = true
    this.pilih(null)
    this.papan.hentikan()
    this.bayangKeNoda()
    const u = this.ukuran
    const { k, kiri, atas } = u
    const lebar = this.kanvasCoret.clientWidth
    const tinggi = this.kanvasCoret.clientHeight
    // jalur zig-zag yang menutup seluruh layar, dalam satuan adegan
    const x0 = -kiri / k - 60
    const x1 = (lebar - kiri) / k + 60
    const yA = -atas / k
    const yB = (tinggi - atas) / k
    const pita = 210
    const baris = Math.max(3, Math.ceil((yB - yA) / (pita * 0.86)))
    const acak = buatAcak(Math.floor(Math.random() * 1e6))
    const zig: Garis = []
    for (let i = 0; i < baris; i++) {
      const y = yA + pita * 0.42 + (yB - yA - pita * 0.84) * (i / (baris - 1))
      zig.push([i % 2 ? x1 : x0, y + acak(-14, 14)], [i % 2 ? x0 : x1, y + acak(-24, 24)])
    }
    const P = sampelUlang(zig, 5)
    const kum = [0]
    for (let i = 1; i < P.length; i++)
      kum.push(kum[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]))
    const total = kum[kum.length - 1]
    const durasi = GERAK_DIKURANGI ? 300 : 1500 + baris * 70
    const E = u.L.penghapus
    const rumahX = E.x * k
    const rumahY = E.y * k
    const el = this.penghapus
    el.classList.add('menghapus')
    el.style.rotate = '0deg'
    // gosokan yang terlihat diiringi loop; dengan gerak dikurangi halamannya langsung bersih
    if (!GERAK_DIKURANGI) suara.mulaiLoop('hapus', BUNYI.menghapus)
    const noda = this.kanvasNoda.getContext('2d')!
    const coret = this.ctxCoret
    const dpr = DPR()
    const lebarHapus = pita * k * dpr
    const garisNoda = Array.from({ length: 6 }, () => ({
      geser: acak(-0.42, 0.42) * pita,
      w: acak(2, 12),
      a: acak(0.008, 0.02),
    }))
    const layar = (q: number[]) => [kiri + q[0] * k, atas + q[1] * k]
    let mulai: number | null = null
    let idx = 0
    kaitkan((t) => {
      if (mulai === null) mulai = t + 260
      // penghapus diangkat dari baki ke titik awal
      if (t < mulai) {
        const naik = batasi(1 - (mulai - t) / 260, 0, 1)
        const sx = rumahX + (P[0][0] * k - rumahX) * naik
        const sy = rumahY + (P[0][1] * k - rumahY) * naik
        el.style.transform = `translate(${sx - rumahX}px, ${sy - rumahY}px) rotate(${E.r + (-14 - E.r) * naik}deg) scale(${1 + 0.1 * naik})`
        return
      }
      const e = batasi((t - mulai) / durasi, 0, 1)
      const target = e * total
      let j = idx
      while (j < P.length - 1 && kum[j + 1] <= target) j++
      const pos = P[j]
      if (j > idx) {
        const potong = P.slice(idx, j + 1)
        for (const s of this.papan.terlihat()) {
          for (const c of s.semuaKanvas) {
            const g = c.getContext('2d')!
            g.save()
            g.globalCompositeOperation = 'destination-out'
            g.lineCap = 'round'
            g.lineJoin = 'round'
            g.lineWidth = lebarHapus
            g.globalAlpha = 0.94
            g.beginPath()
            potong.forEach((q, n) => {
              const [lx, ly] = layar(q)
              const [cx, cy] = s.keKanvas(lx, ly)
              if (n) g.lineTo(cx, cy)
              else g.moveTo(cx, cy)
            })
            g.stroke()
            g.restore()
          }
        }
        coret.save()
        coret.globalCompositeOperation = 'destination-out'
        coret.lineCap = 'round'
        coret.lineWidth = lebarHapus
        coret.beginPath()
        potong.forEach((q, n) => {
          const [lx, ly] = layar(q)
          if (n) coret.lineTo(lx * dpr, ly * dpr)
          else coret.moveTo(lx * dpr, ly * dpr)
        })
        coret.stroke()
        coret.restore()
        // jejak abu-abu tipis yang ditinggalkan penghapus
        noda.save()
        noda.lineCap = 'round'
        noda.lineJoin = 'round'
        const jalur = (geser: number) => {
          noda.beginPath()
          potong.forEach((q, n) => {
            const [lx, ly] = layar([q[0], q[1] + geser])
            if (n) noda.lineTo(lx * dpr, ly * dpr)
            else noda.moveTo(lx * dpr, ly * dpr)
          })
        }
        noda.strokeStyle = 'rgba(120,118,126,.012)'
        noda.lineWidth = pita * 0.9 * k * dpr
        jalur(0)
        noda.stroke()
        for (const s of garisNoda) {
          noda.strokeStyle = `rgba(104,102,112,${s.a.toFixed(3)})`
          noda.lineWidth = s.w * k * dpr
          jalur(s.geser)
          noda.stroke()
        }
        noda.restore()
        if (acak() < 0.7) {
          const [lx, ly] = layar([pos[0] + acak(-60, 60), pos[1] + acak(-50, 50)])
          this.tebarRemah(lx, ly, 2)
        }
        idx = j
      }
      el.style.transform = `translate(${pos[0] * k - rumahX}px, ${pos[1] * k - rumahY}px) rotate(${-14 + Math.sin(t / 70) * 6}deg) scale(1.1)`
      if (e < 1) return
      // selesai: semuanya bersih, penghapus kembali ke baki
      for (const s of this.papan.sketsa.values()) s.ulang()
      this.coretan = []
      coret.clearRect(0, 0, this.kanvasCoret.width, this.kanvasCoret.height)
      suara.hentikanLoop('hapus')
      suara.mainkan(BUNYI.halamanBersih)
      el.classList.remove('menghapus')
      el.classList.add('pulang')
      el.style.transform = ''
      el.style.rotate = E.r + 'deg'
      setTimeout(() => el.classList.remove('pulang'), 600)
      setTimeout(() => {
        this.menghapus = false
        this.papan.sibuk = false
        this.setelahBersih()
      }, 380)
      return false
    })
  }

  // ---------- remah penghapus ----------

  private tebarRemah(x: number, y: number, n: number) {
    if (GERAK_DIKURANGI) return
    const k = Math.max(0.5, this.ukuran?.k ?? 1)
    for (let i = 0; i < n && this.remah.length < 220; i++) {
      const a = Math.random() * Math.PI * 2
      const v = (30 + Math.random() * 140) * k
      this.remah.push({
        x,
        y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        hidup: 1 + Math.random() * 1.3,
        umur: 0,
        w: (1.6 + Math.random() * 3.4) * Math.max(0.6, k),
        h: (1 + Math.random() * 1.6) * Math.max(0.6, k),
        rot: Math.random() * Math.PI * 2,
        warna: Math.random() < 0.6 ? '#f0a3b2' : '#b9b6bf',
      })
    }
    if (!this.remahJalan) {
      this.remahJalan = true
      kaitkan((_, dt) => this.langkahRemah(dt))
    }
  }

  private langkahRemah(dt: number) {
    const g = this.kanvasRemah.getContext('2d')!
    const dpr = DPR()
    g.setTransform(1, 0, 0, 1, 0, 0)
    g.clearRect(0, 0, this.kanvasRemah.width, this.kanvasRemah.height)
    g.setTransform(dpr, 0, 0, dpr, 0, 0)
    const gesek = Math.pow(0.02, dt)
    for (let i = this.remah.length - 1; i >= 0; i--) {
      const p = this.remah[i]
      p.umur += dt
      if (p.umur >= p.hidup) {
        this.remah.splice(i, 1)
        continue
      }
      p.vx *= gesek
      p.vy *= gesek
      p.x += p.vx * dt
      p.y += p.vy * dt
      g.globalAlpha = Math.min(1, 3 * (1 - p.umur / p.hidup))
      g.fillStyle = p.warna
      g.beginPath()
      g.ellipse(p.x, p.y, p.w / 2, p.h / 2, p.rot, 0, Math.PI * 2)
      g.fill()
    }
    g.globalAlpha = 1
    this.remahJalan = this.remah.length > 0 || this.menghapus
    return this.remahJalan
  }
}
