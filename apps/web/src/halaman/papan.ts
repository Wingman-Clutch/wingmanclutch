// Papan: semua sketsa di halaman, posisinya, urutan menggambarnya, layar yang berganti, dan
// kepakan logo setiap kali diketuk.

import { batalkan, cicil, GERAK_DIKURANGI, jadwalkan, type Tugas } from '../engine/animasi'
import type { Op } from '../engine/goresan'
import type { Tema } from '../engine/kuas'
import { Sketsa } from '../engine/sketsa'
import { PROYEK, type IdProyek } from '../data/proyek'
import { DASAR_LABEL } from '../sketsa/bantu'
import {
  bulan,
  kilauKecil,
  kopi,
  kotakKontak,
  matahari,
  petunjukKetuk,
  petunjukPensil,
  rumus,
  tanggal,
  tentang,
  tim,
} from '../sketsa/catatan'
import { DASAR_LOGO, JUMLAH_KEPAK, kepakAwal, kepakTambahan, logo } from '../sketsa/logo'
import { atasItem, type Ukuran } from './tata-letak'

export type Aksi =
  | { jenis: 'proyek'; id: IdProyek }
  | { jenis: 'tentang' | 'tim' | 'kontak' }
  | { jenis: 'tema' | 'logo' }

export interface Def {
  id: string
  /** kunci posisi di tata letak (default sama dengan id) */
  tempat?: string
  ops: () => Op[]
  layar?: (() => Op[])[]
  /** garis dasar tulisan dalam satuan gambar, untuk `baris` di tata letak */
  dasar: number
  tombol?: { label: string; aksi: Aksi }
  kelas?: string
  /** tinta yang tidak ikut tema, misalnya tulisan di kertas tempel kuning */
  temaTetap?: Tema
}

/** urutan menggambar saat halaman dibuka: [id, tunda ms, durasi ms] */
const URUTAN: [string, number, number][] = [
  ['tanggal', 150, 600],
  ['logo', 300, 2300],
  ['kepak', 2680, 420],
  ['postpocket', 650, 1250],
  ['gorute', 820, 1250],
  ['tikoem', 990, 1250],
  ['tookthel', 1160, 1250],
  ['tentang', 1000, 650],
  ['tim', 1700, 1000],
  ['petunjukBawah', 1950, 650],
  ['petunjukSamping', 1950, 700],
  ['kontak', 1550, 1100],
  ['kopi', 2150, 900],
  ['petunjukPensil', 2400, 650],
  ['rumus', 2250, 800],
  ['kilau1', 2000, 400],
  ['kilau2', 2200, 400],
  ['saklar-bulan', 2350, 650],
  ['saklar-matahari', 2350, 650],
]

export function daftarDef(): Def[] {
  const defs: Def[] = [
    {
      id: 'logo',
      ops: logo,
      dasar: DASAR_LOGO,
      tombol: {
        label: 'Wingman Clutch. Ketuk logonya buat mengepakkan sayapnya',
        aksi: { jenis: 'logo' },
      },
      kelas: 'logo',
    },
    { id: 'kepak', tempat: 'logo', ops: kepakAwal, dasar: DASAR_LOGO, kelas: 'kepak' },
    ...Array.from({ length: JUMLAH_KEPAK }, (_, i) => ({
      id: 'kepak' + (i + 1),
      tempat: 'logo',
      ops: () => kepakTambahan(i),
      dasar: DASAR_LOGO,
      kelas: 'kepak',
    })),
    ...PROYEK.map<Def>((p) => ({
      id: p.id,
      ops: () => p.gambar(true),
      layar: p.layar,
      dasar: DASAR_LABEL,
      tombol: {
        label: `${p.nama}: ${p.slogan} Buka detailnya`,
        aksi: { jenis: 'proyek', id: p.id },
      },
      kelas: `perangkat gerak-${p.gerak}`,
    })),
    {
      id: 'tentang',
      ops: tentang,
      dasar: 0,
      tombol: { label: 'Tentang kami', aksi: { jenis: 'tentang' } },
      kelas: 'tempel',
      temaTetap: 'terang',
    },
    {
      id: 'tim',
      ops: tim,
      dasar: 150,
      tombol: { label: 'Kenalan sama tim: 2 orang', aksi: { jenis: 'tim' } },
    },
    {
      id: 'kontak',
      ops: kotakKontak,
      dasar: 80,
      tombol: { label: "Hubungi kami: punya ide? Let's clutch it", aksi: { jenis: 'kontak' } },
    },
    { id: 'tanggal', ops: tanggal, dasar: 0 },
    { id: 'petunjukBawah', ops: () => petunjukKetuk('bawah'), dasar: 32 },
    { id: 'petunjukSamping', ops: () => petunjukKetuk('samping'), dasar: 32 },
    { id: 'petunjukPensil', ops: petunjukPensil, dasar: 30 },
    { id: 'kopi', ops: kopi, dasar: 0 },
    { id: 'rumus', ops: rumus, dasar: 34 },
    { id: 'kilau1', ops: kilauKecil, dasar: 0 },
    { id: 'kilau2', tempat: 'kilau1', ops: kilauKecil, dasar: 0 },
    {
      id: 'saklar-bulan',
      tempat: 'saklar',
      ops: bulan,
      dasar: 0,
      tombol: { label: 'Ganti ke mode gelap', aksi: { jenis: 'tema' } },
      kelas: 'saklar',
    },
    {
      id: 'saklar-matahari',
      tempat: 'saklar',
      ops: matahari,
      dasar: 0,
      tombol: { label: 'Ganti ke mode terang', aksi: { jenis: 'tema' } },
      kelas: 'saklar',
    },
  ]
  // kilau2 punya posisi sendiri di potret
  defs.find((d) => d.id === 'kilau2')!.tempat = 'kilau2'
  return defs
}

export class Papan {
  readonly el: HTMLElement
  readonly sketsa = new Map<string, Sketsa>()
  private defs = new Map<string, Def>()
  private ukuran?: Ukuran
  private tema: Tema = 'terang'
  private tugas: Tugas[] = []
  private pengatur = new Set<number>()
  private kepakan = 0
  sibuk = false

  constructor(el: HTMLElement, aksi: (a: Aksi, sumber: HTMLElement) => void) {
    this.el = el
    for (const d of daftarDef()) {
      this.defs.set(d.id, d)
      let wadah: HTMLElement
      if (d.tombol) {
        const b = document.createElement('button')
        b.type = 'button'
        b.setAttribute('aria-label', d.tombol.label)
        const a = d.tombol.aksi
        b.addEventListener('click', () => {
          if (!this.sibuk) aksi(a, b)
        })
        wadah = b
      } else {
        wadah = document.createElement('div')
        wadah.setAttribute('aria-hidden', 'true')
      }
      const s = new Sketsa(d.id, d.ops, d.layar ?? [], wadah)
      if (d.kelas) s.el.classList.add(...d.kelas.split(' '))
      s.el.hidden = true
      el.appendChild(s.el)
      this.sketsa.set(d.id, s)
    }
    // Kompilasi dicicil mengikuti urutan menggambar, di luar tugas yang membuka halaman. Sketsa
    // yang belum siap saat gilirannya digambar dikompilasi saat itu juga.
    const urut = [...URUTAN].sort((a, b) => a[1] - b[1]).map(([id]) => id)
    const semua = [...new Set([...urut, ...this.sketsa.keys()])]
    cicil(semua.map((id) => () => this.sketsa.get(id)!.siapkan()))
  }

  /** tempatkan semua sketsa untuk ukuran layar dan tema ini */
  atur(u: Ukuran, tema: Tema) {
    this.ukuran = u
    this.tema = tema
    for (const [id, s] of this.sketsa) {
      const d = this.defs.get(id)!
      const t = u.L.item[d.tempat ?? id]
      const saklarSalah = (id === 'saklar-bulan') !== (tema === 'terang') && id.startsWith('saklar')
      s.el.hidden = !t || saklarSalah
      if (!t) continue
      const atas = atasItem(u.L, t, d.dasar)
      s.tempatkan(
        { x: u.kiri + t.x * u.k, y: u.atas + atas * u.k, skala: t.s * u.k, r: t.r ?? 0 },
        d.temaTetap ?? tema,
      )
    }
  }

  warnai(tema: Tema) {
    if (!this.ukuran) return
    const ganti = (this.tema === 'terang') !== (tema === 'terang')
    this.tema = tema
    if (ganti) this.atur(this.ukuran, tema)
    else
      for (const [id, s] of this.sketsa)
        if (!s.el.hidden) s.warnai(this.defs.get(id)!.temaTetap ?? tema)
  }

  /** gambar semua sketsa dari awal sesuai URUTAN */
  pembukaan() {
    this.hentikan()
    for (const s of this.sketsa.values()) {
      s.ulang()
      s.el.classList.remove('selesai')
    }
    this.kepakan = 0
    for (const [id, tunda, durasi] of URUTAN) {
      const s = this.sketsa.get(id)
      if (!s) continue
      this.tugas.push(
        jadwalkan(
          tunda,
          durasi,
          (p) => s.gambar(p),
          () => s.el.classList.add('selesai'),
        ),
      )
      if (s.jumlahLayar) this.putarLayar(s, tunda + durasi * 0.75)
    }
  }

  /** layar perangkat bergantian: gambar, tahan, pudar, ganti */
  private putarLayar(s: Sketsa, tunda: number) {
    let i = 0
    const kanvasLayar = s.semuaKanvas[1]
    const satu = () => {
      kanvasLayar.classList.remove('pudar')
      const gambar = s.pilihLayar(i % s.jumlahLayar)
      this.tugas.push(
        jadwalkan(0, 1000, gambar, () => {
          if (GERAK_DIKURANGI && i > 0) return
          this.tunda(() => {
            kanvasLayar.classList.add('pudar')
            this.tunda(() => {
              i++
              satu()
            }, 380)
          }, 3800)
        }),
      )
    }
    this.tunda(satu, tunda)
  }

  private tunda(f: () => void, ms: number) {
    const h = window.setTimeout(() => {
      this.pengatur.delete(h)
      f()
    }, ms)
    this.pengatur.add(h)
  }

  /** hentikan semua gambar dan layar yang sedang berjalan */
  hentikan() {
    for (const t of this.tugas) batalkan(t)
    this.tugas = []
    for (const h of this.pengatur) clearTimeout(h)
    this.pengatur.clear()
  }

  /** satu kepakan sayap tambahan; mengembalikan false kalau sudah habis */
  kepak() {
    if (this.kepakan >= JUMLAH_KEPAK) return false
    const s = this.sketsa.get('kepak' + (this.kepakan + 1))!
    this.kepakan++
    s.ulang()
    this.tugas.push(jadwalkan(40, 320, (p) => s.gambar(p)))
    return true
  }

  /** sketsa yang sedang tampil */
  *terlihat() {
    for (const s of this.sketsa.values()) if (!s.el.hidden) yield s
  }
}
