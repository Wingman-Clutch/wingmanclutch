// Layar pembuka: lambang Wingman Clutch muncul di tengah kertas, mengepakkan sayap dua kali, lalu
// meluncur ke tempatnya di halaman. Setelah mendarat, sketsa halaman mulai digambar. Skrip di <head>
// index.html yang memutuskan tampil atau tidak: sekali per sesi browser, dan tidak pernah kalau
// pengguna memilih gerak dikurangi. Ketukan atau tombol apa pun mempercepatnya.

import { kepakkan } from '../sketsa/logo'

/** kunci sessionStorage: layar pembuka sudah tampil di sesi ini */
export const KUNCI_PEMBUKA = 'wc-pembuka'

const tunggu = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

/** selesai saat `janji` selesai atau setelah `ms`, mana yang lebih dulu; true kalau janjinya berhasil */
const paling = (janji: Promise<unknown>, ms: number) =>
  Promise.race([janji.then(() => true).catch(() => false), tunggu(ms).then(() => false)])

export class Pembuka {
  private readonly el: HTMLElement
  private readonly panggung: HTMLElement
  private readonly lambang: HTMLImageElement
  private cepat = false
  private percepat?: () => void

  constructor(el: HTMLElement) {
    this.el = el
    this.panggung = el.querySelector('.panggung')!
    this.lambang = el.querySelector('img.lambang')!
    try {
      sessionStorage.setItem(KUNCI_PEMBUKA, '1')
    } catch {
      // penyimpanan diblokir: layar pembuka tampil lagi di kunjungan berikutnya
    }
    const lewati = () => {
      this.cepat = true
      this.percepat?.()
    }
    addEventListener('pointerdown', lewati, { once: true })
    addEventListener('keydown', lewati, { once: true })
  }

  /** jeda yang langsung berakhir begitu pengguna mengetuk atau menekan tombol */
  private jeda(ms: number) {
    if (this.cepat) return Promise.resolve()
    return new Promise<void>((r) => {
      const t = setTimeout(r, ms)
      this.percepat = () => {
        clearTimeout(t)
        r()
      }
    })
  }

  /**
   * Jalankan layar pembuka sampai lambang mendarat di `tujuan` (kotak lambang di halaman, dalam
   * piksel layar). Lapisan pembuka baru dibuang lewat tutup(), setelah lambang halaman tergambar.
   */
  async jalan(tujuan: () => DOMRect) {
    const asli = this.lambang.src
    if (await paling(this.lambang.decode(), 1500)) {
      this.el.classList.add('muncul')
      await this.jeda(560)
      if (!this.cepat)
        await kepakkan((p) => {
          this.lambang.src = p?.src ?? asli
          this.el.classList.toggle('naik', p?.src.endsWith('-naik.webp') ?? false)
        }, 2)
      this.lambang.src = asli
      this.el.classList.remove('naik')
      await this.jeda(220)
    }
    await this.luncur(tujuan(), this.cepat ? 280 : 760)
  }

  /** lambang meluncur dan mengecil ke kotak tujuan, kertas pembuka memudar */
  private async luncur(t: DOMRect, ms: number) {
    const a = this.panggung.getBoundingClientRect()
    const s = t.width / a.width
    const dx = t.left + t.width / 2 - (a.left + a.width / 2)
    const dy = t.top + t.height / 2 - (a.top + a.height / 2)
    this.el.classList.add('luncur')
    const gerak = this.panggung.animate(
      [{ transform: 'none' }, { transform: `translate(${dx}px, ${dy}px) scale(${s})` }],
      { duration: ms, easing: 'cubic-bezier(0.55, 0, 0.2, 1)', fill: 'forwards' },
    )
    this.el.querySelector('.latar')!.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: ms * 0.8,
      delay: ms * 0.2,
      fill: 'forwards',
    })
    await gerak.finished.catch(() => {})
  }

  /** buang lapisan pembuka; dipanggil setelah lambang halaman tergambar di tempat yang sama */
  tutup() {
    document.documentElement.classList.remove('pembuka')
    this.el.remove()
  }
}
