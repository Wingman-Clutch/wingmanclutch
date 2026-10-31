import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { batasGoresan, kompilasi } from '../src/engine/goresan'
import { jangkauanLampu } from '../src/halaman/lampu'
import { sudutIstirahat } from '../src/halaman/lipatan'
import { daftarDef } from '../src/halaman/papan'
import { atasItem, atasKaki, hitungUkuran, pilihTata, TATA } from '../src/halaman/tata-letak'

const defs = daftarDef()

interface Kotak {
  x0: number
  y0: number
  x1: number
  y1: number
}

const tindih = (a: Kotak, b: Kotak) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1

/** kolom TANGGAL tercetak (label, garis, tulisan) dan lampu gantung di dekatnya */
function kolomTanggal(kunci: 'potret' | 'lanskap'): [string, Kotak][] {
  const T = TATA[kunci].tanggal
  const lampu = jangkauanLampu(TATA[kunci].lampu)
  // label digambar kertas.ts rata kanan 10 satuan sebelum garis; 82 = lebar terburuk di font sistem
  return [
    ['label TANGGAL', { x0: T.x0 - 10 - 82, y0: T.y - 14, x1: T.x0 - 10, y1: T.y + 4 }],
    ['garis tanggal', { x0: T.x0, y0: T.y - 2, x1: T.x1, y1: T.y + 4 }],
    ['tulisan tanggal', kotakDi(kunci, 'tanggal')!],
    ['lampu', lampu.gambar],
    ['tali lampu', lampu.tali],
  ]
}

function kotakDi(kunci: 'potret' | 'lanskap', id: string): Kotak | null {
  const L = TATA[kunci]
  const d = defs.find((x) => x.id === id)!
  const t = L.item[d.tempat ?? id]
  if (!t) return null
  const b = batasGoresan(kompilasi(d.ops(), 1))
  const atas = atasItem(L, t, d.dasar)
  return {
    x0: t.x + b.x * t.s,
    y0: atas + b.y * t.s,
    x1: t.x + (b.x + b.w) * t.s,
    y1: atas + (b.y + b.h) * t.s,
  }
}

describe('tata letak', () => {
  it('memilih potret untuk layar sempit dan lanskap untuk layar lebar', () => {
    expect(pilihTata(390, 844)).toBe('potret')
    expect(pilihTata(1440, 900)).toBe('lanskap')
    expect(pilihTata(1024, 1366)).toBe('potret')
  })

  it('adegan selalu muat di layar tanpa scroll', () => {
    for (const [w, h] of [
      [320, 568],
      [390, 844],
      [768, 1024],
      [1280, 720],
      [1920, 1080],
    ]) {
      const u = hitungUkuran(w, h)
      expect(u.L.W * u.k).toBeLessThanOrEqual(w + 0.01)
      expect(u.atas + u.L.H * u.k).toBeLessThanOrEqual(h + 0.01)
    }
  })

  it('setiap posisi di tata letak dipakai sebuah sketsa', () => {
    const tempat = new Set(defs.map((d) => d.tempat ?? d.id))
    for (const L of Object.values(TATA))
      for (const k of Object.keys(L.item)) expect(tempat).toContain(k)
  })

  for (const kunci of ['potret', 'lanskap'] as const) {
    it(`semua sketsa ${kunci} berada di dalam halaman`, () => {
      const L = TATA[kunci]
      for (const d of defs) {
        const k = kotakDi(kunci, d.id)
        if (!k) continue
        expect.soft(k.x0, `${d.id} kiri`).toBeGreaterThan(-12)
        expect.soft(k.y0, `${d.id} atas`).toBeGreaterThan(-12)
        expect.soft(k.x1, `${d.id} kanan`).toBeLessThan(L.W + 12)
        expect.soft(k.y1, `${d.id} bawah`).toBeLessThan(L.H + 12)
      }
    })

    it(`logo, empat aplikasi, kontak, dan tim tidak saling tindih (${kunci})`, () => {
      const utama = ['logo', 'postpocket', 'gorute', 'tikoem', 'tookthel', 'kontak', 'tim']
      const kotak = utama.map((id) => [id, kotakDi(kunci, id)!] as const)
      for (let i = 0; i < kotak.length; i++)
        for (let j = i + 1; j < kotak.length; j++) {
          const [a, ka] = kotak[i]
          const [b, kb] = kotak[j]
          // toleransi 4% untuk garis yang kebablasan
          const sx = Math.min(ka.x1, kb.x1) - Math.max(ka.x0, kb.x0)
          const sy = Math.min(ka.y1, kb.y1) - Math.max(ka.y0, kb.y0)
          const tumpang =
            sx > 0 && sy > 0
              ? (sx * sy) /
                Math.min((ka.x1 - ka.x0) * (ka.y1 - ka.y0), (kb.x1 - kb.x0) * (kb.y1 - kb.y0))
              : 0
          expect.soft(tumpang, `${a} dan ${b}`).toBeLessThan(0.04)
        }
    })

    it(`lampu dan talinya sampai tarikan penuh tidak menimpa sketsa mana pun (${kunci})`, () => {
      const L = TATA[kunci]
      const lampu = jangkauanLampu(L.lampu)
      expect(lampu.gambar.x1).toBeLessThan(L.W)
      expect(lampu.tali.x1).toBeLessThan(L.W)
      for (const d of defs) {
        const k = kotakDi(kunci, d.id)
        if (!k) continue
        expect.soft(tindih(lampu.gambar, k), `lampu dan ${d.id}`).toBe(false)
        expect.soft(tindih(lampu.tali, k), `tali lampu dan ${d.id}`).toBe(false)
      }
    })

    it(`logo dan semua kepakannya tidak menimpa kolom tanggal dan lampu (${kunci})`, () => {
      const sayap = defs.filter((d) => (d.tempat ?? d.id) === 'logo')
      expect(sayap.length).toBeGreaterThan(2)
      for (const d of sayap)
        for (const [nama, k] of kolomTanggal(kunci))
          expect.soft(tindih(kotakDi(kunci, d.id)!, k), `${d.id} dan ${nama}`).toBe(false)
    })
  }
})

describe('sudut terlipat saat diam', () => {
  for (const [w, h] of [
    [320, 568],
    [390, 844],
    [768, 1024],
    [919, 1000],
    [920, 1000],
    [1000, 900],
    [1280, 720],
    [1440, 900],
    [1920, 1080],
    [2560, 1080],
  ]) {
    it(`tidak menutupi kolom tanggal dan lampu (${w}x${h})`, () => {
      const u = hitungUkuran(w, h)
      const a = sudutIstirahat(w, h)
      const sudut = { x0: w - a, y0: 0, x1: w, y1: a }
      for (const [nama, k] of kolomTanggal(u.kunci)) {
        const layar = {
          x0: u.kiri + k.x0 * u.k,
          y0: u.atas + k.y0 * u.k,
          x1: u.kiri + k.x1 * u.k,
          y1: u.atas + k.y1 * u.k,
        }
        expect.soft(tindih(layar, sudut), nama).toBe(false)
      }
    })
  }
})

/** jalankan skrip di <head> index.html untuk satu ukuran layar; kembalikan yang dipasangnya */
function skripAwal(
  lebar: number,
  tinggi: number,
  { sesi = null as string | null, kurangi = false, suara = null as string | null } = {},
) {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8')
  const skrip = html.match(/<script>([\s\S]*?)<\/script>/)![1]
  const gaya = new Map<string, string>()
  const kelas = new Set<string>()
  const akar = {
    dataset: {} as Record<string, string>,
    style: { setProperty: (k: string, v: string) => gaya.set(k, v) },
    classList: { add: (k: string) => kelas.add(k) },
  }
  new Function(
    'document',
    'innerWidth',
    'innerHeight',
    'localStorage',
    'sessionStorage',
    'matchMedia',
    skrip,
  )(
    { documentElement: akar, querySelector: () => ({}) },
    lebar,
    tinggi,
    { getItem: (k: string) => (k === 'wc-suara' ? suara : null) },
    { getItem: () => sesi },
    (q: string) => ({ matches: kurangi && q.includes('reduced-motion') }),
  )
  return {
    tata: akar.dataset.tata,
    u: gaya.get('--u')!,
    kaki: gaya.get('--kaki')!,
    pembuka: kelas.has('pembuka'),
    suara: akar.dataset.suara,
  }
}

describe('tombol suara sebelum skrip utama jalan', () => {
  it('suara yang pernah dimatikan sudah tertulis mati di kaki halaman', () => {
    expect(skripAwal(390, 844, { suara: '{"nyala":false,"volume":0.7}' }).suara).toBe('mati')
  })

  it('belum pernah memilih, atau isinya rusak: tetap nyala', () => {
    expect(skripAwal(390, 844).suara).toBeUndefined()
    expect(skripAwal(390, 844, { suara: '{rusak' }).suara).toBeUndefined()
    expect(skripAwal(390, 844, { suara: '{"nyala":true}' }).suara).toBeUndefined()
  })
})

describe('layar pembuka', () => {
  it('tampil di kunjungan pertama sebuah sesi', () => {
    expect(skripAwal(1440, 900).pembuka).toBe(true)
  })

  it('tidak tampil lagi di sesi yang sama', () => {
    expect(skripAwal(1440, 900, { sesi: '1' }).pembuka).toBe(false)
  })

  it('tidak pernah tampil kalau pengguna memilih gerak dikurangi', () => {
    expect(skripAwal(390, 844, { kurangi: true }).pembuka).toBe(false)
  })
})

describe('tata letak sebelum skrip utama jalan', () => {
  // termasuk tepat di batas potret/lanskap (lebar/tinggi = 0,92)
  for (const [w, h] of [
    [320, 568],
    [390, 844],
    [412, 915],
    [919, 1000],
    [920, 1000],
    [768, 1024],
    [1280, 720],
    [1440, 900],
    [1920, 1080],
  ]) {
    it(`skrip di <head> sama dengan hitungUkuran dan atasKaki (${w}x${h})`, () => {
      const u = hitungUkuran(w, h)
      const awal = skripAwal(w, h)
      expect(awal.tata).toBe(u.kunci)
      expect(parseFloat(awal.u)).toBeCloseTo(u.k, 9)
      expect(parseFloat(awal.kaki)).toBeCloseTo(atasKaki(u), 9)
    })
  }
})
