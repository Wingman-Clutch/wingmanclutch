import { cueNames, getPlaybackMode, type CueName, type UISFXPlayer } from 'uisfx'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BUNYI_HASIL } from '../src/halaman/kontak'
import {
  bacaPreferensi,
  BUNYI,
  KUNCI_SUARA,
  Suara,
  TUNDA_LOOP,
  type Dom,
  type Lingkungan,
} from '../src/halaman/suara'

/** pemutar uisfx tiruan: mencatat cue yang dimainkan dan yang masih berbunyi */
function pemutarTiruan() {
  const dimainkan: CueName[] = []
  const berbunyi = new Set<CueName>()
  let nyala = true
  const pemutar = {
    unlock: vi.fn(async () => true),
    play: vi.fn((cue: CueName) => {
      if (!nyala) return null
      dimainkan.push(cue)
      berbunyi.add(cue)
      return { stop: vi.fn(() => void berbunyi.delete(cue)), ended: Promise.resolve() }
    }),
    preload: vi.fn(async () => {}),
    setPack: vi.fn(),
    getPack: () => 'zen' as const,
    setVolume: vi.fn(),
    getVolume: () => 0.7,
    setEnabled: vi.fn((v: boolean) => {
      nyala = v
    }),
    isEnabled: () => nyala,
    stopAll: vi.fn(() => berbunyi.clear()),
    destroy: vi.fn(async () => {}),
  }
  return { pemutar, dimainkan, berbunyi }
}

/** Suara dengan browser tiruan; `atur` mengubah waktu, aktivasi, dan apakah konteks bisa bangun */
function siapkan({ tersimpan = null as string | null, bisaBangun = true } = {}) {
  const atur = { waktu: 0, aktivasi: true as boolean | undefined }
  const simpanan = new Map<string, string>(tersimpan ? [[KUNCI_SUARA, tersimpan]] : [])
  const { pemutar, dimainkan, berbunyi } = pemutarTiruan()
  const urutan: string[] = []
  const konteks = {
    state: 'suspended' as AudioContextState,
    resume: vi.fn(async () => {
      if (bisaBangun) konteks.state = 'running'
    }),
    close: vi.fn(async () => {
      urutan.push('close')
      konteks.state = 'closed'
    }),
  }
  pemutar.destroy.mockImplementation(async () => void urutan.push('destroy'))
  const createUISFX = vi.fn(() => pemutar as unknown as UISFXPlayer)
  const muat = vi.fn(async () => ({ createUISFX }))
  const ling = {
    simpanan: () => ({
      getItem: (k: string) => simpanan.get(k) ?? null,
      setItem: (k: string, v: string) => void simpanan.set(k, v),
    }),
    buatKonteks: vi.fn(() => konteks as unknown as AudioContext),
    muat: muat as unknown as Lingkungan['muat'],
    aktivasi: () => atur.aktivasi,
    sekarang: () => atur.waktu,
    senggang: (f: () => void) => f(),
  } satisfies Lingkungan
  const suara = new Suara(ling)

  const jendela = new EventTarget()
  const dokumen = Object.assign(new EventTarget(), { hidden: false })
  const dom: Dom = { jendela, dokumen, akar: { dataset: {} } }
  const atribut: Record<string, string> = {}
  const tombol = Object.assign(new EventTarget(), {
    setAttribute: (n: string, v: string) => void (atribut[n] = v),
  })
  const sentuh = (jenis = 'pointerdown') => jendela.dispatchEvent(new Event(jenis))
  const klikTombol = () => tombol.dispatchEvent(new Event('click'))
  const sembunyikan = (hidden: boolean) => {
    dokumen.hidden = hidden
    dokumen.dispatchEvent(new Event('visibilitychange'))
  }
  return {
    suara,
    ling,
    atur,
    simpanan,
    pemutar,
    dimainkan,
    berbunyi,
    urutan,
    konteks,
    createUISFX,
    dom,
    tombol,
    atribut,
    sentuh,
    klikTombol,
    sembunyikan,
  }
}

/** sudah dipasang dan pengunjung sudah mengetuk sekali: pemutar siap */
async function siap(opsi?: Parameters<typeof siapkan>[0]) {
  const s = siapkan(opsi)
  s.suara.pasang(s.tombol, s.dom)
  s.sentuh()
  await s.suara.bangunkan()
  return s
}

afterEach(() => {
  vi.useRealTimers()
})

describe('bunyi di halaman', () => {
  it('hanya memakai cue dari katalog uisfx, dan loop hanya untuk proses yang terlihat', () => {
    for (const [kejadian, cue] of Object.entries(BUNYI)) expect(cueNames, kejadian).toContain(cue)
    const loop = Object.entries(BUNYI)
      .filter(([, cue]) => getPlaybackMode(cue) === 'loop')
      .map(([kejadian]) => kejadian)
    expect(loop.sort()).toEqual(['menghapus', 'mengirim'])
  })

  it('setiap hasil kiriman form kontak punya bunyinya sendiri', () => {
    expect(BUNYI_HASIL).toEqual({
      terkirim: 'send',
      tidak_valid: 'error',
      terlalu_sering: 'blocked',
      gagal: 'error',
    })
  })
})

describe('pemutar suara', () => {
  it('tidak membuat audio dan tidak berbunyi sebelum pengunjung bergerak', async () => {
    const s = siapkan()
    s.suara.pasang(s.tombol, s.dom)
    await Promise.resolve()
    // modulnya sudah dimuat saat senggang, tapi konteks audio belum dibuat
    expect(s.ling.muat).toHaveBeenCalledTimes(1)
    expect(s.ling.buatKonteks).not.toHaveBeenCalled()
    expect(s.suara.mainkan('open')).toBeNull()
    expect(s.dimainkan).toEqual([])
  })

  it('gerakan pertama membuat satu konteks dan satu pemutar zen; gerakan berikutnya memakainya lagi', async () => {
    const s = await siap()
    for (const jenis of ['pointerup', 'keydown', 'click']) s.sentuh(jenis)
    await s.suara.bangunkan()
    expect(s.ling.buatKonteks).toHaveBeenCalledTimes(1)
    expect(s.konteks.resume).toHaveBeenCalledTimes(1)
    expect(s.createUISFX).toHaveBeenCalledTimes(1)
    expect(s.createUISFX).toHaveBeenCalledWith({
      pack: 'zen',
      volume: 0.7,
      enabled: true,
      context: s.konteks,
    })
    expect(s.pemutar.preload).toHaveBeenCalledTimes(1)
    expect(s.suara.mainkan('open')).not.toBeNull()
    expect(s.dimainkan).toEqual(['open'])
  })

  it('konteks yang masih tertahan hanya berbunyi selama aktivasi pengguna, tidak ditunda', async () => {
    const s = await siap({ bisaBangun: false })
    s.atur.aktivasi = false
    // misalnya jawaban kiriman yang datang setelah aktivasinya habis
    expect(s.suara.mainkan('send')).toBeNull()
    s.atur.aktivasi = true
    expect(s.suara.mainkan('open')).not.toBeNull()
    // browser yang tidak bisa memberi tahu aktivasi: dianggap aktif sedetik setelah gerakan
    s.atur.aktivasi = undefined
    s.atur.waktu = 500
    expect(s.suara.mainkan('close')).not.toBeNull()
    s.atur.waktu = 1500
    expect(s.suara.mainkan('close')).toBeNull()
    expect(s.dimainkan).toEqual(['open', 'close'])
  })
})

describe('loop', () => {
  it('berhenti saat proses berhasil, sebelum bunyi hasilnya dimainkan', async () => {
    const s = await siap()
    const hasil = await s.suara.proses('kirim', 'loading', async () => {
      expect(s.berbunyi.has('loading')).toBe(true)
      return 'terkirim'
    })
    expect(hasil).toBe('terkirim')
    expect(s.berbunyi.has('loading')).toBe(false)
  })

  it('berhenti juga saat proses gagal, dan galatnya tetap diteruskan', async () => {
    const s = await siap()
    const gagal = s.suara.proses('kirim', 'loading', async () => {
      throw new Error('putus')
    })
    await expect(gagal).rejects.toThrow('putus')
    expect(s.berbunyi.has('loading')).toBe(false)
  })

  it('proses cepat tidak sempat berbunyi; proses lama baru berbunyi setelah ditunda', async () => {
    const s = await siap()
    vi.useFakeTimers()
    const selesaiDalam = (ms: number) => () =>
      new Promise<string>((r) => setTimeout(() => r('ok'), ms))
    const cepat = s.suara.proses('kirim', 'loading', selesaiDalam(300), TUNDA_LOOP)
    await vi.advanceTimersByTimeAsync(300)
    await cepat
    await vi.advanceTimersByTimeAsync(TUNDA_LOOP)
    expect(s.dimainkan).not.toContain('loading')

    const lama = s.suara.proses('kirim', 'loading', selesaiDalam(2000), TUNDA_LOOP)
    await vi.advanceTimersByTimeAsync(TUNDA_LOOP)
    expect(s.berbunyi.has('loading')).toBe(true)
    await vi.advanceTimersByTimeAsync(2000)
    await lama
    expect(s.berbunyi.has('loading')).toBe(false)
  })

  it('dihentikan dari luar sebelum sempat mulai (dialog ditutup): tidak pernah berbunyi', async () => {
    const s = await siap()
    vi.useFakeTimers()
    const kirim = s.suara.proses(
      'kirim',
      'loading',
      () => new Promise((r) => setTimeout(r, 2000)),
      TUNDA_LOOP,
    )
    s.suara.hentikanLoop('kirim')
    await vi.advanceTimersByTimeAsync(2000)
    await kirim
    expect(s.dimainkan).not.toContain('loading')
  })

  it('dimulai lagi selama masih jalan tidak menumpuk', async () => {
    const s = await siap()
    const a = s.suara.mulaiLoop('hapus', 'processing')
    expect(s.suara.mulaiLoop('hapus', 'processing')).toBe(a)
    expect(s.dimainkan).toEqual(['processing'])
    s.suara.hentikanLoop('hapus')
    expect(s.berbunyi.has('processing')).toBe(false)
    // pegangan lama sudah dibuang, jadi gosokan berikutnya benar-benar berbunyi lagi
    s.suara.mulaiLoop('hapus', 'processing')
    expect(s.dimainkan).toEqual(['processing', 'processing'])
  })

  it('halaman disembunyikan atau suara dimatikan: loop langsung berhenti', async () => {
    const s = await siap()
    s.suara.mulaiLoop('hapus', 'processing')
    s.sembunyikan(true)
    expect(s.berbunyi.has('processing')).toBe(false)
    expect(s.pemutar.stopAll).toHaveBeenCalledTimes(1)
    s.sembunyikan(false)

    s.suara.mulaiLoop('kirim', 'loading')
    s.klikTombol()
    expect(s.berbunyi.has('loading')).toBe(false)
    expect(s.suara.mulaiLoop('kirim', 'loading')).toBeNull()
    s.klikTombol()
    await s.suara.bangunkan()
    expect(s.suara.mulaiLoop('kirim', 'loading')).not.toBeNull()
  })
})

describe('pilihan suara', () => {
  it('mati langsung membungkam dan tersimpan; nyala lagi memberi tanda', async () => {
    const s = await siap()
    expect(s.atribut['aria-pressed']).toBe('true')
    s.klikTombol()
    expect(s.atribut['aria-pressed']).toBe('false')
    expect(s.dom.akar.dataset.suara).toBe('mati')
    expect(JSON.parse(s.simpanan.get(KUNCI_SUARA)!)).toEqual({ nyala: false, volume: 0.7 })
    expect(s.pemutar.setEnabled).toHaveBeenLastCalledWith(false)
    expect(s.suara.mainkan('open')).toBeNull()

    s.klikTombol()
    await s.suara.bangunkan()
    expect(s.atribut['aria-pressed']).toBe('true')
    expect(s.dom.akar.dataset.suara).toBe('nyala')
    expect(s.pemutar.setPack).toHaveBeenLastCalledWith('zen')
    expect(s.pemutar.setVolume).toHaveBeenLastCalledWith(0.7)
    expect(s.dimainkan).toEqual(['toggle-on'])
  })

  it('kunjungan berikutnya mengikuti pilihan tersimpan, dan selama mati tidak membuat audio', async () => {
    const s = siapkan({ tersimpan: JSON.stringify({ nyala: false, volume: 0.4 }) })
    s.suara.pasang(s.tombol, s.dom)
    expect(s.suara.pref).toEqual({ nyala: false, volume: 0.4 })
    expect(s.atribut['aria-pressed']).toBe('false')
    s.sentuh()
    expect(s.ling.muat).not.toHaveBeenCalled()
    expect(s.ling.buatKonteks).not.toHaveBeenCalled()

    // dinyalakan: konteks dibuat di klik itu juga, dengan volume tersimpan
    s.klikTombol()
    await s.suara.bangunkan()
    expect(s.createUISFX).toHaveBeenCalledWith(
      expect.objectContaining({ pack: 'zen', volume: 0.4, enabled: true }),
    )
    expect(s.dimainkan).toEqual(['toggle-on'])
  })

  it('isi tersimpan yang rusak atau penyimpanan yang diblokir kembali ke bawaan', () => {
    const bawaan = { nyala: true, volume: 0.7 }
    const isi = (v: string | null) => ({ getItem: () => v, setItem() {} })
    expect(bacaPreferensi(null)).toEqual(bawaan)
    expect(bacaPreferensi(isi('{rusak'))).toEqual(bawaan)
    expect(bacaPreferensi(isi('{"nyala":"ya","volume":3}'))).toEqual(bawaan)
    const diblokir = {
      getItem: (): string => {
        throw new Error('SecurityError')
      },
      setItem() {},
    }
    expect(bacaPreferensi(diblokir)).toEqual(bawaan)
  })
})

describe('di luar browser dan saat dipasang ulang', () => {
  it('bisa dimuat tanpa window; pemutar bawaannya diam saja', async () => {
    expect(typeof window).toBe('undefined')
    const s = new Suara()
    await s.bangunkan()
    expect(s.mainkan('open')).toBeNull()
  })

  it('dipasang dua kali tetap satu set pendengar; dibongkar: pemutar dihancurkan, lalu konteks ditutup', async () => {
    const s = siapkan()
    s.suara.pasang(s.tombol, s.dom)
    s.suara.pasang(s.tombol, s.dom)
    s.sentuh()
    await s.suara.bangunkan()
    // satu klik hanya mengganti sekali; kalau terpasang dua kali, suaranya kembali nyala
    s.klikTombol()
    expect(s.suara.pref.nyala).toBe(false)
    s.klikTombol()
    await s.suara.bangunkan()

    s.suara.mulaiLoop('hapus', 'processing')
    await s.suara.hancurkan()
    expect(s.urutan).toEqual(['destroy', 'close'])
    expect(s.berbunyi.has('processing')).toBe(false)
    s.sentuh()
    s.klikTombol()
    expect(s.ling.buatKonteks).toHaveBeenCalledTimes(1)
    expect(s.suara.pref.nyala).toBe(true)
    expect(s.suara.mainkan('open')).toBeNull()
  })
})
