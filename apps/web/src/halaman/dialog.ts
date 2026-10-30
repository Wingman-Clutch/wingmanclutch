// Dialog berupa kertas yang ditempel selotip: detail aplikasi, tentang kami, tim, dan kontak.

import { ambilStatistik } from '../api/klien'
import type { StatistikProyek } from '../api/kontrak'
import { judul } from '../engine/huruf'
import { PENSIL, type Tema } from '../engine/kuas'
import { gambarKe } from '../engine/sketsa'
import { PROYEK, TIM, type IdProyek } from '../data/proyek'
import { sketsaFoto } from './foto-sketsa'
import type { Lanyard } from './lanyard'
import { svgLogo } from './merek'

export type NamaDialog = 'proyek' | 'tentang' | 'tim' | 'kontak'

const $ = <T extends HTMLElement>(s: string, akar: ParentNode = document) =>
  akar.querySelector(s) as T

function gambarJudul(
  kanvas: HTMLCanvasElement,
  teks: string,
  tema: Tema,
  bayang: 'r' | 'p' | 'b' | 'g' | 'o' = 'r',
) {
  const tinggi = 46
  const ops = judul(teks, 0, tinggi, tinggi, { bayang })
  const lebarMaks = Math.min(kanvas.parentElement!.clientWidth - 40, 520)
  gambarKe(kanvas, ops, 'judul-' + teks, tema)
  // judul panjang dikecilkan supaya muat satu baris
  const lebar = parseFloat(kanvas.style.width)
  if (lebarMaks > 0 && lebar > lebarMaks) gambarKe(kanvas, ops, 'judul-' + teks, tema, lebarMaks)
}

function waktuLalu(iso: string) {
  const detik = (Date.now() - new Date(iso).getTime()) / 1000
  if (!Number.isFinite(detik) || detik < 0) return 'baru saja'
  const hari = Math.floor(detik / 86400)
  if (hari >= 30) return `${Math.floor(hari / 30)} bulan lalu`
  if (hari >= 1) return `${hari} hari lalu`
  const jam = Math.floor(detik / 3600)
  if (jam >= 1) return `${jam} jam lalu`
  return 'baru saja'
}

const KATA_STATUS: Record<StatistikProyek['status'], string> = {
  online: '● online',
  gangguan: '● lagi gangguan',
  tidak_diketahui: '',
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, kelas: string, teks?: string) {
  const e = document.createElement(tag)
  e.className = kelas
  if (teks) e.textContent = teks
  return e
}

export class Dialog {
  private sumber: HTMLElement | null = null
  private tema: () => Tema
  /** modul lanyard baru dimuat saat dialog tim pertama kali dibuka */
  private lanyard?: Promise<Lanyard>

  constructor(tema: () => Tema) {
    this.tema = tema
    for (const d of document.querySelectorAll<HTMLDialogElement>('dialog')) {
      // ketuk di luar kertas menutup dialog
      d.addEventListener('click', (e) => {
        if (e.target === d) d.close()
      })
      d.addEventListener('close', () => {
        if (d.id === 'dlg-tim') void this.lanyard?.then((l) => l.berhenti())
        this.sumber?.focus({ preventScroll: true })
        this.sumber = null
      })
    }
    for (const b of document.querySelectorAll<HTMLButtonElement>('[data-buka]')) {
      b.addEventListener('click', () => {
        const asal = this.sumber
        b.closest('dialog')!.close()
        this.buka(b.dataset.buka as NamaDialog, asal)
      })
    }
    this.isiTim()
  }

  buka(nama: NamaDialog, sumber: HTMLElement | null, id?: IdProyek) {
    const d = $<HTMLDialogElement>(`#dlg-${nama}`)
    if (nama === 'proyek' && id) this.isiProyek(d, id)
    d.showModal()
    this.sumber = sumber
    const kanvas = d.querySelector<HTMLCanvasElement>('canvas.judul-sketsa')
    if (kanvas?.dataset.judul)
      gambarJudul(kanvas, kanvas.dataset.judul, this.tema(), (kanvas.dataset.warna as 'r') || 'r')
    if (nama === 'proyek') this.gambarFitur(d)
    if (nama === 'tim') this.bukaTim()
    d.scrollTop = 0
  }

  /** gambar ulang judul dialog yang sedang terbuka setelah tema berganti */
  warnai() {
    const d = document.querySelector<HTMLDialogElement>('dialog[open]')
    if (!d) return
    const kanvas = d.querySelector<HTMLCanvasElement>('canvas.judul-sketsa')
    if (kanvas?.dataset.judul)
      gambarJudul(kanvas, kanvas.dataset.judul, this.tema(), (kanvas.dataset.warna as 'r') || 'r')
    if (d.id === 'dlg-proyek') this.gambarFitur(d)
    if (d.id === 'dlg-tim') void this.lanyard?.then((l) => l.warnai(this.gayaTali()))
  }

  private isiProyek(d: HTMLDialogElement, id: IdProyek) {
    const p = PROYEK.find((x) => x.id === id)!
    d.dataset.proyek = id
    $('#pr-nama', d).textContent = p.nama
    $('#pr-slogan', d).textContent = p.slogan
    $('#pr-deskripsi', d).textContent = p.deskripsi
    $('#pr-peran', d).textContent = p.peran
    $<HTMLAnchorElement>('#pr-buka', d).href = p.url
    $<HTMLAnchorElement>('#pr-repo', d).href = p.repo
    const tumpukan = $('#pr-tumpukan', d)
    tumpukan.replaceChildren(
      ...p.tumpukan.map((t) => {
        const li = document.createElement('li')
        li.textContent = t
        return li
      }),
    )
    const fitur = $('#pr-fitur', d)
    fitur.replaceChildren(
      ...p.fitur.map((f) => {
        const li = document.createElement('li')
        const c = document.createElement('canvas')
        c.setAttribute('aria-hidden', 'true')
        const h = document.createElement('h3')
        h.textContent = f.judul
        const t = document.createElement('p')
        t.textContent = f.teks
        li.append(c, h, t)
        return li
      }),
    )
    const kanvas = $<HTMLCanvasElement>('canvas.judul-sketsa', d)
    kanvas.dataset.judul = p.nama
    kanvas.dataset.warna = p.warna
    const stat = $('#pr-statistik', d)
    stat.hidden = true
    void ambilStatistik().then((s) => {
      const x = s?.proyek.find((q) => q.id === id)
      if (!x || d.dataset.proyek !== id) return
      const bagian = [
        `★ ${x.bintang}`,
        `diperbarui ${waktuLalu(x.terakhirDiperbarui)}`,
        KATA_STATUS[x.status],
      ].filter(Boolean)
      stat.textContent = bagian.join(' · ')
      stat.dataset.status = x.status
      stat.hidden = false
    })
  }

  /** sketsa perangkat dengan layar ke-i untuk setiap fitur */
  private gambarFitur(d: HTMLDialogElement) {
    const p = PROYEK.find((x) => x.id === d.dataset.proyek)
    if (!p) return
    d.querySelectorAll<HTMLCanvasElement>('#pr-fitur canvas').forEach((c, i) => {
      // di layar sempit gambar dan teksnya bersebelahan, kolom gambarnya 120 px
      const sempit = matchMedia('(max-width: 560px)').matches
      const lebar = sempit ? 120 : Math.max(110, Math.min(170, c.parentElement!.clientWidth - 8))
      gambarKe(c, [...p.gambar(false), ...p.layar[i]()], `${p.id}-fitur-${i}`, this.tema(), lebar)
    })
  }

  /** kartu nama berlanyard untuk setiap anggota tim, dan tautan GitHub di bawah panggung */
  private isiTim() {
    const kartu = TIM.map((a) => {
      const k = el('div', 'badge')
      // tombol transparan di atas kartu: kartunya sendiri bukan tombol, supaya teks di kartu
      // tidak bertabrakan dengan nama tombol
      const tombol = el('button', 'balik')
      tombol.type = 'button'
      tombol.setAttribute('aria-pressed', 'false')
      tombol.setAttribute(
        'aria-label',
        `Kartu nama ${a.panggilan}, ${a.nama}, ${a.peran}. Tekan untuk membalik`,
      )

      const depan = el('div', 'muka depan')
      const pita = el('div', 'pita')
      pita.append(svgLogo('mendatar'))
      const foto = el('canvas', 'foto')
      foto.dataset.foto = a.foto ?? ''
      foto.dataset.inisial = a.panggilan[0]
      const nama = el('canvas', 'nama')
      nama.dataset.nama = a.panggilan
      depan.append(pita, foto, nama, el('span', 'jabatan', a.peran))

      const belakang = el('div', 'muka belakang')
      const bawah = el('div', 'pita-bawah')
      bawah.append(svgLogo('lambang'), el('span', 'semboyan', 'two is enough to win.'))
      belakang.append(
        svgLogo('mendatar'),
        el('strong', 'lengkap', a.nama),
        el('span', 'jabatan', a.peran),
        el('span', 'akun', a.github.replace(/^https:\/\//, '')),
        bawah,
      )
      // isi kartu sudah dibacakan lewat aria-label
      for (const m of [depan, belakang]) {
        m.setAttribute('aria-hidden', 'true')
        m.append(el('span', 'lubang'), el('span', 'kilap'))
      }
      const isi = el('div', 'isi')
      isi.append(depan, belakang)
      k.append(el('span', 'jepit'), tombol, isi)
      return k
    })
    $('#tm-daftar').replaceChildren(...kartu)

    $('#tm-github').replaceChildren(
      'GitHub: ',
      ...TIM.flatMap((a, i) => {
        const t = document.createElement('a')
        t.href = a.github
        t.target = '_blank'
        t.rel = 'noopener'
        t.textContent = a.panggilan
        const panah = el('span', '', ' ↗')
        panah.setAttribute('aria-hidden', 'true')
        t.append(panah)
        return i ? [' · ', t] : [t]
      }),
    )
  }

  /** gambar foto dan nama di kartu (sekali saja), lalu jalankan lanyard selama dialog terbuka */
  private bukaTim() {
    // ukuran kanvas kartu diatur CSS mengikuti lebar kartu, bukan oleh gambarKe
    const lepasUkuran = (c: HTMLCanvasElement) => {
      c.style.removeProperty('width')
      c.style.removeProperty('height')
    }
    for (const c of document.querySelectorAll<HTMLCanvasElement>('#tm-daftar canvas.foto')) {
      if (c.dataset.siap) continue
      c.dataset.siap = '1'
      const inisial = () => {
        gambarKe(c, judul(c.dataset.inisial!, 0, 60, 60, { bayang: 'r' }), 'inisial', 'terang')
        lepasUkuran(c)
      }
      if (!c.dataset.foto) inisial()
      else sketsaFoto(c.dataset.foto, c).catch(inisial)
    }
    for (const c of document.querySelectorAll<HTMLCanvasElement>('#tm-daftar canvas.nama')) {
      if (c.dataset.siap) continue
      c.dataset.siap = '1'
      const ops = judul(c.dataset.nama!, 0, 46, 46, { bayang: 'r' })
      gambarKe(c, ops, 'nama-' + c.dataset.nama, 'terang', 260)
      lepasUkuran(c)
    }
    const panggung = $('#tm-daftar')
    this.lanyard ??= import('./lanyard').then(
      ({ Lanyard }) =>
        new Lanyard(
          panggung,
          [...panggung.querySelectorAll<HTMLElement>('.badge')],
          this.gayaTali(),
        ),
    )
    void this.lanyard.then((l) => {
      // dialognya bisa saja sudah ditutup lagi sebelum modulnya termuat
      if (!panggung.closest('dialog')!.open) return
      l.warnai(this.gayaTali())
      l.mulai()
    })
  }

  /** tali grafit bercetak kuning di kertas terang; di kertas gelap dibalik supaya tetap terlihat */
  private gayaTali() {
    const terang = this.tema() === 'terang'
    return {
      warna: terang ? PENSIL.w : PENSIL.y,
      tinta: terang ? PENSIL.y : PENSIL.w,
      teks: 'two is enough to win',
      label: 'WINGMAN CLUTCH',
    }
  }
}
