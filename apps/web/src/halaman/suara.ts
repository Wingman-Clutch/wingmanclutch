// Suara antarmuka dari uisfx dengan pack zen: lipatan kertas, sapuan kuas, dan kayu kering, jadi
// cocok dengan buku catatan bergambar pensil. Suara hanya menguatkan tanda yang sudah terlihat
// (lembar terbuka, lampu padam, pesan terkirim), tidak pernah jadi satu-satunya tanda. Tidak ada
// yang berbunyi sebelum pengunjung mengetuk, mengklik, atau menekan tombol. Pilihan nyala atau mati
// disimpan di localStorage seperti tema, dan bisa diganti lewat tombol suara di kaki halaman.
//
// Bunyinya disintesis uisfx di browser, jadi tidak ada berkas audio yang diunduh. Modulnya baru
// dimuat saat browser senggang, dan konteks audio baru dibuat di gerakan pertama pengunjung.

import type { CueName, PlayingSFX, UISFXPlayer } from 'uisfx'

export const PACK = 'zen'
export const VOLUME = 0.7
/** kunci localStorage; skrip di <head> index.html juga membacanya supaya kaki halaman langsung benar */
export const KUNCI_SUARA = 'wc-suara'

/** kejadian di halaman dan cue uisfx-nya; `menghapus` dan `mengirim` adalah loop */
export const BUNYI = {
  bukaLembar: 'open',
  tutupLembar: 'close',
  lampuNyala: 'toggle-on',
  lampuPadam: 'toggle-off',
  kupasSudut: 'swipe',
  balikKartu: 'swipe',
  pilihPensil: 'select',
  letakkanPensil: 'deselect',
  menghapus: 'processing',
  halamanBersih: 'delete',
  mengirim: 'loading',
  terkirim: 'send',
  isianSalah: 'error',
  kebanyakanKirim: 'blocked',
  gagalKirim: 'error',
  tersalin: 'copy',
  salinManual: 'info',
  suaraNyala: 'toggle-on',
} as const satisfies Record<string, CueName>

/** semua cue di atas, disintesis lebih dulu setelah pemutar dibuat */
const DIPAKAI = [...new Set(Object.values(BUNYI))]

/** loop baru berbunyi kalau prosesnya lebih lama dari ini, supaya kiriman cepat cukup satu bunyi */
export const TUNDA_LOOP = 700

export interface Preferensi {
  nyala: boolean
  volume: number
}

type Simpanan = Pick<Storage, 'getItem' | 'setItem'>

export function bacaPreferensi(simpanan: Simpanan | null): Preferensi {
  let isi: unknown = null
  try {
    isi = JSON.parse(simpanan?.getItem(KUNCI_SUARA) ?? 'null')
  } catch {
    // rusak atau penyimpanan diblokir: pakai bawaan
  }
  const p = (typeof isi === 'object' && isi ? isi : {}) as Partial<Preferensi>
  const volume = p.volume
  return {
    nyala: typeof p.nyala === 'boolean' ? p.nyala : true,
    volume: typeof volume === 'number' && volume >= 0 && volume <= 1 ? volume : VOLUME,
  }
}

/** yang dibutuhkan pemutar dari browser; unit test memberi tiruannya */
export interface Lingkungan {
  simpanan: () => Simpanan | null
  buatKonteks: () => AudioContext | null
  muat: () => Promise<Pick<typeof import('uisfx'), 'createUISFX'>>
  /** sedang ada aktivasi pengguna, atau undefined kalau browser tidak bisa memberi tahu */
  aktivasi: () => boolean | undefined
  sekarang: () => number
  senggang: (f: () => void) => void
}

const BROWSER: Lingkungan = {
  simpanan: () => {
    try {
      return typeof localStorage === 'undefined' ? null : localStorage
    } catch {
      return null
    }
  },
  buatKonteks: () => {
    if (typeof window === 'undefined') return null
    const Konteks =
      window.AudioContext ??
      (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    try {
      return Konteks ? new Konteks({ latencyHint: 'interactive' }) : null
    } catch {
      return null
    }
  },
  muat: () => import('uisfx'),
  aktivasi: () =>
    typeof navigator === 'undefined' ? undefined : navigator.userActivation?.isActive,
  sekarang: () => performance.now(),
  senggang: (f) => {
    if ('requestIdleCallback' in window) requestIdleCallback(f, { timeout: 3000 })
    else setTimeout(f, 1500)
  },
}

/** bagian DOM yang dipakai pasang(); unit test memberi EventTarget biasa */
export interface Dom {
  jendela: EventTarget
  dokumen: EventTarget & { hidden: boolean }
  akar: { dataset: DOMStringMap }
}

/** gerakan yang bisa membangunkan audio: tekan pointer dan tombol, lepas jari, dan klik */
const GERAKAN = ['pointerdown', 'pointerup', 'keydown', 'click'] as const

export class Suara {
  pref: Preferensi = { nyala: true, volume: VOLUME }
  private konteks: AudioContext | null = null
  private pemutar: UISFXPlayer | null = null
  private uisfx?: Pick<typeof import('uisfx'), 'createUISFX'>
  private modul?: Promise<unknown>
  private praMuat?: AbortController
  /** loop yang sedang berbunyi, dan loop yang menunggu TUNDA_LOOP, per proses */
  private loop = new Map<string, PlayingSFX>()
  private tertunda = new Map<string, ReturnType<typeof setTimeout>>()
  private gerakTerakhir = -Infinity
  private lepas?: () => void
  private habis = false

  constructor(private readonly ling: Lingkungan = BROWSER) {}

  /**
   * Pasang sekali di halaman: baca pilihan tersimpan, tandai tombol suara, dan dengarkan gerakan
   * pengunjung. Dipanggil lagi tidak memasang apa pun dua kali.
   */
  pasang(
    tombol: (EventTarget & Pick<Element, 'setAttribute'>) | null,
    dom: Dom = { jendela: window, dokumen: document, akar: document.documentElement },
  ) {
    if (this.lepas || this.habis) return
    this.pref = bacaPreferensi(this.ling.simpanan())
    const tampilkan = () => {
      dom.akar.dataset.suara = this.pref.nyala ? 'nyala' : 'mati'
      tombol?.setAttribute('aria-pressed', String(this.pref.nyala))
    }
    const gerak = () => void this.bangunkan()
    const lihat = () => {
      if (dom.dokumen.hidden) this.diam()
    }
    const alih = () => {
      this.atur(!this.pref.nyala)
      tampilkan()
    }
    for (const j of GERAKAN) dom.jendela.addEventListener(j, gerak, { capture: true })
    dom.dokumen.addEventListener('visibilitychange', lihat)
    tombol?.addEventListener('click', alih)
    this.lepas = () => {
      for (const j of GERAKAN) dom.jendela.removeEventListener(j, gerak, { capture: true })
      dom.dokumen.removeEventListener('visibilitychange', lihat)
      tombol?.removeEventListener('click', alih)
    }
    tampilkan()
    if (this.pref.nyala) this.ling.senggang(() => void this.muat())
  }

  /**
   * Dipanggil di setiap gerakan pengunjung: buat konteks audio sekali dan bangunkan, lalu buat
   * pemutar begitu modul uisfx siap. Selesai saat pemutar siap dipakai.
   */
  bangunkan(): Promise<void> {
    this.gerakTerakhir = this.ling.sekarang()
    if (!this.pref.nyala || this.habis) return Promise.resolve()
    this.konteks ??= this.ling.buatKonteks()
    const k = this.konteks
    if (!k) return Promise.resolve()
    if (k.state !== 'running') k.resume().catch(() => {})
    if (this.uisfx) {
      this.buatPemutar()
      return Promise.resolve()
    }
    return this.muat().then(() => this.buatPemutar())
  }

  /** bunyikan satu cue, atau null kalau suara mati, belum boleh berbunyi, atau pemutar belum siap */
  mainkan(cue: CueName): PlayingSFX | null {
    if (!this.boleh()) return null
    return this.pemutar!.play(cue)
  }

  /** mulai loop untuk proses `kunci`; memanggilnya lagi selama loop masih jalan tidak menumpuk */
  mulaiLoop(kunci: string, cue: CueName) {
    const ada = this.loop.get(kunci)
    if (ada) return ada
    const h = this.mainkan(cue)
    if (h) this.loop.set(kunci, h)
    return h
  }

  /** hentikan loop proses `kunci`, termasuk yang masih menunggu untuk mulai */
  hentikanLoop(kunci: string) {
    clearTimeout(this.tertunda.get(kunci))
    this.tertunda.delete(kunci)
    this.loop.get(kunci)?.stop()
    this.loop.delete(kunci)
  }

  /**
   * Jalankan `kerja` dengan loop `cue` selama prosesnya terlihat. Loop baru mulai setelah `tunda`
   * ms, dan berhenti di semua jalan keluar: berhasil, gagal, atau dihentikan dari luar. Bunyi
   * hasilnya dimainkan pemanggil setelah ini selesai.
   */
  async proses<T>(kunci: string, cue: CueName, kerja: () => Promise<T>, tunda = 0): Promise<T> {
    this.hentikanLoop(kunci)
    if (tunda > 0)
      this.tertunda.set(
        kunci,
        setTimeout(() => {
          this.tertunda.delete(kunci)
          this.mulaiLoop(kunci, cue)
        }, tunda),
      )
    else this.mulaiLoop(kunci, cue)
    try {
      return await kerja()
    } finally {
      this.hentikanLoop(kunci)
    }
  }

  /** tombol suara: simpan pilihannya; mati langsung membungkam bunyi dan loop yang sedang jalan */
  atur(nyala: boolean) {
    if (!nyala) this.diam()
    this.pref = { ...this.pref, nyala }
    try {
      this.ling.simpanan()?.setItem(KUNCI_SUARA, JSON.stringify(this.pref))
    } catch {
      // penyimpanan diblokir: pilihan tetap berlaku untuk kunjungan ini
    }
    this.terapkan()
    if (nyala) void this.bangunkan().then(() => this.mainkan(BUNYI.suaraNyala))
  }

  /** hentikan semua loop dan bunyi, misalnya saat halaman disembunyikan */
  diam() {
    for (const kunci of new Set([...this.loop.keys(), ...this.tertunda.keys()]))
      this.hentikanLoop(kunci)
    this.pemutar?.stopAll()
  }

  /** bongkar semuanya: pemutar dihancurkan dulu, baru konteks audio milik halaman ini ditutup */
  async hancurkan() {
    this.habis = true
    this.lepas?.()
    this.lepas = undefined
    this.praMuat?.abort()
    this.diam()
    const pemutar = this.pemutar
    const konteks = this.konteks
    this.pemutar = null
    this.konteks = null
    await pemutar?.destroy()
    await konteks?.close().catch(() => {})
  }

  private boleh() {
    const k = this.konteks
    if (!this.pref.nyala || !this.pemutar || !k) return false
    if (k.state === 'running') return true
    // konteks masih tertahan: bunyi di luar gerakan pengunjung akan tertunda lalu berbunyi
    // belakangan, jadi hanya boleh selama aktivasi pengguna masih berlaku
    return this.ling.aktivasi() ?? this.ling.sekarang() - this.gerakTerakhir < 1000
  }

  private muat() {
    this.modul ??= this.ling.muat().then(
      (m) => {
        this.uisfx = m
      },
      () => {
        // gagal diunduh: coba lagi di gerakan berikutnya
        this.modul = undefined
      },
    )
    return this.modul
  }

  private buatPemutar() {
    if (this.pemutar || !this.uisfx || !this.konteks || this.habis) return
    this.pemutar = this.uisfx.createUISFX({
      pack: PACK,
      volume: this.pref.volume,
      enabled: this.pref.nyala,
      context: this.konteks,
    })
    this.praMuat = new AbortController()
    void this.pemutar.preload(DIPAKAI, { signal: this.praMuat.signal }).catch(() => {})
  }

  private terapkan() {
    const p = this.pemutar
    if (!p) return
    p.setPack(PACK)
    p.setVolume(this.pref.volume)
    p.setEnabled(this.pref.nyala)
  }
}

/** satu pemutar untuk seluruh halaman */
export const suara = new Suara()
