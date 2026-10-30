// Dialog berupa kertas yang ditempel selotip: detail aplikasi, tentang kami, tim, dan kontak.

import { ambilStatistik } from '../api/klien'
import type { StatistikProyek } from '../api/kontrak'
import { judul } from '../engine/huruf'
import type { Tema } from '../engine/kuas'
import { gambarKe } from '../engine/sketsa'
import { PROYEK, TIM, type IdProyek } from '../data/proyek'
import { sketsaFoto } from './foto-sketsa'

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

export class Dialog {
  private sumber: HTMLElement | null = null
  private tema: () => Tema

  constructor(tema: () => Tema) {
    this.tema = tema
    for (const d of document.querySelectorAll<HTMLDialogElement>('dialog')) {
      // ketuk di luar kertas menutup dialog
      d.addEventListener('click', (e) => {
        if (e.target === d) d.close()
      })
      d.addEventListener('close', () => {
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
    if (nama === 'tim') this.gambarFotoTim()
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

  private isiTim() {
    const daftar = $('#tm-daftar')
    daftar.replaceChildren(
      ...TIM.map((a, i) => {
        const li = document.createElement('li')
        li.style.setProperty('--miring', `${i % 2 ? 2.5 : -2}deg`)
        const fig = document.createElement('figure')
        const c = document.createElement('canvas')
        c.className = 'foto'
        c.dataset.foto = a.foto ?? ''
        c.dataset.inisial = a.panggilan[0]
        c.setAttribute('role', 'img')
        c.setAttribute('aria-label', `Sketsa pensil ${a.panggilan}`)
        const cap = document.createElement('figcaption')
        const nama = document.createElement('a')
        nama.href = a.github
        nama.target = '_blank'
        nama.rel = 'noopener'
        nama.className = 'nama'
        nama.textContent = a.panggilan
        const lengkap = document.createElement('span')
        lengkap.className = 'lengkap'
        lengkap.textContent = a.nama
        const peran = document.createElement('span')
        peran.className = 'peran'
        peran.textContent = a.peran
        cap.append(nama, lengkap, peran)
        fig.append(c, cap)
        li.append(fig)
        return li
      }),
    )
  }

  private gambarFotoTim() {
    for (const c of document.querySelectorAll<HTMLCanvasElement>('#tm-daftar canvas.foto')) {
      if (c.dataset.siap) continue
      c.dataset.siap = '1'
      const inisial = () =>
        gambarKe(c, judul(c.dataset.inisial!, 0, 60, 60, { bayang: 'r' }), 'inisial', 'terang')
      if (!c.dataset.foto) inisial()
      else sketsaFoto(c.dataset.foto, c).catch(inisial)
    }
  }
}
