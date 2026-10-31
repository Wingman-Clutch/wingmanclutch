import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Galat } from '../_lib/jawab.js'
import { kunciIp, pembatasMemori, type Pembatas } from '../_lib/batas.js'
import { BATAS_WAKTU_MS, kirimEmail, subjek } from '../_lib/email.js'
import { BODY_MAKS, tanganiKontak, type Kebutuhan } from '../_lib/kontak.js'
import type { Kontak } from '../_lib/validasi.js'
import { cocok } from './kontrak.js'

const valid = {
  nama: 'Sari',
  email: 'sari@contoh.com',
  pesan: 'Mau bikin aplikasi kasir.',
  situs: '',
}

function minta(body: unknown, opsi: { method?: string; tipe?: string; ip?: string } = {}) {
  const { method = 'POST', tipe = 'application/json', ip = '203.0.113.7' } = opsi
  return new Request('http://lokal/api/kontak', {
    method,
    headers: { 'content-type': tipe, 'x-forwarded-for': `${ip}, 10.0.0.1` },
    body: method === 'GET' ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  })
}

function siapkan(kebutuhan: Partial<Kebutuhan> = {}) {
  const terkirim: Kontak[] = []
  const deps: Kebutuhan = {
    pembatas: pembatasMemori(),
    kirim: async (k) => void terkirim.push(k),
    ...kebutuhan,
  }
  return { terkirim, panggil: (req: Request) => tanganiKontak(req, deps) }
}

/** body jawaban sebagai Galat; skemanya tetap dicek terpisah dengan cocok() */
const baca = (r: Response) => r.json() as Promise<Galat>

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('POST /api/kontak', () => {
  it('202 untuk pesan valid, sudah dipangkas, tanpa cache', async () => {
    const { panggil, terkirim } = siapkan()
    const r = await panggil(minta({ ...valid, nama: '  Sari  ' }))
    expect(r.status).toBe(202)
    expect(r.headers.get('content-type')).toBe('application/json; charset=utf-8')
    expect(r.headers.get('cache-control')).toBe('no-store')
    expect(cocok('Terkirim', await baca(r))).toBe(true)
    expect(terkirim).toEqual([{ nama: 'Sari', email: 'sari@contoh.com', pesan: valid.pesan }])
  })

  it('405 dengan Allow: POST untuk metode lain', async () => {
    const r = await siapkan().panggil(minta(undefined, { method: 'GET' }))
    expect(r.status).toBe(405)
    expect(r.headers.get('allow')).toBe('POST')
  })

  it('415 untuk content type selain JSON, tapi charset boleh', async () => {
    const { panggil } = siapkan()
    const r = await panggil(minta('nama=sari', { tipe: 'text/plain' }))
    expect(r.status).toBe(415)
    expect(cocok('Galat', await baca(r))).toBe(true)
    expect((await panggil(minta(valid, { tipe: 'application/json; charset=utf-8' }))).status).toBe(
      202,
    )
  })

  it('413 untuk body lebih dari 16 KB', async () => {
    const r = await siapkan().panggil(minta({ ...valid, pesan: 'x'.repeat(BODY_MAKS) }))
    expect(r.status).toBe(413)
    expect(cocok('Galat', await baca(r))).toBe(true)
  })

  it('400 untuk JSON rusak atau bukan objek', async () => {
    const { panggil } = siapkan()
    for (const body of ['{rusak', '[1,2]', 'null', '"teks"']) {
      const r = await panggil(minta(body))
      expect(r.status).toBe(400)
      const isi = await baca(r)
      expect(cocok('Galat', isi)).toBe(true)
      expect(isi.galat).toBe('INPUT_TIDAK_VALID')
    }
  })

  it('202 tapi tidak mengirim apa pun kalau jebakan bot terisi', async () => {
    const { panggil, terkirim } = siapkan()
    const r = await panggil(minta({ ...valid, email: 'x', situs: 'http://spam' }))
    expect(r.status).toBe(202)
    expect(terkirim).toEqual([])
  })

  it('400 dengan daftar kolom sesuai urutan frontend', async () => {
    const { panggil, terkirim } = siapkan()
    const r = await panggil(minta({ nama: '  ', email: 'sari', pesan: 'hai', situs: '' }))
    expect(r.status).toBe(400)
    const isi = await baca(r)
    expect(cocok('Galat', isi)).toBe(true)
    expect(isi.kolom).toEqual([
      { kolom: 'nama', alasan: 'wajib' },
      { kolom: 'email', alasan: 'format' },
      { kolom: 'pesan', alasan: 'terlalu_pendek' },
    ])
    const panjang = await panggil(
      minta({
        ...valid,
        nama: 'x'.repeat(81),
        email: `${'a'.repeat(250)}@b.co`,
        pesan: 'y'.repeat(2001),
      }),
    )
    expect((await baca(panjang)).kolom!.map((k: { alasan: string }) => k.alasan)).toEqual([
      'terlalu_panjang',
      'terlalu_panjang',
      'terlalu_panjang',
    ])
    const kosong = await panggil(minta({}))
    expect((await baca(kosong)).kolom).toHaveLength(3)
    expect(terkirim).toEqual([])
  })

  it('429 dengan Retry-After setelah 5 pesan per jam dari jaringan yang sama', async () => {
    const { panggil, terkirim } = siapkan()
    for (let i = 0; i < 5; i++) expect((await panggil(minta(valid))).status).toBe(202)
    const r = await panggil(minta(valid))
    expect(r.status).toBe(429)
    const isi = await baca(r)
    expect(cocok('Galat', isi)).toBe(true)
    expect(isi.galat).toBe('TERLALU_SERING')
    expect(r.headers.get('retry-after')).toBe(String(isi.cobaLagiDetik))
    expect(isi.cobaLagiDetik).toBeGreaterThan(3500)
    expect(terkirim).toHaveLength(5)
    // jaringan lain tidak ikut kena
    expect((await panggil(minta(valid, { ip: '198.51.100.1' }))).status).toBe(202)
  })

  it('kunci batas kirim memakai hash IP paling kiri, bukan IP mentah', async () => {
    const kunci: string[] = []
    const pembatas: Pembatas = { cek: async (k) => (kunci.push(k), { boleh: true }) }
    await siapkan({ pembatas }).panggil(minta(valid))
    expect(kunci).toEqual([kunciIp('203.0.113.7')])
    expect(kunci[0]).toMatch(/^[0-9a-f]{64}$/)
    expect(kunciIp('203.0.113.7', 'a')).not.toBe(kunciIp('203.0.113.7', 'b'))
  })

  it('kiriman yang ditolak tidak memakai kuota batas kirim', async () => {
    // smoke test produksi (apps/web/e2e-produksi) mengandalkan urutan ini setiap hari
    const kunci: string[] = []
    const pembatas: Pembatas = { cek: async (k) => (kunci.push(k), { boleh: true }) }
    const { panggil, terkirim } = siapkan({ pembatas })
    const ditolak: [Request, number][] = [
      [minta(undefined, { method: 'GET' }), 405],
      [minta('halo', { tipe: 'text/plain' }), 415],
      [minta({ ...valid, pesan: 'x'.repeat(BODY_MAKS) }), 413],
      [minta('{rusak'), 400],
      [minta({ nama: '', email: '', pesan: '', situs: '' }), 400],
      [minta({ ...valid, situs: 'http://spam' }), 202],
    ]
    for (const [req, status] of ditolak) expect((await panggil(req)).status).toBe(status)
    expect(kunci).toEqual([])
    expect(terkirim).toEqual([])
  })

  it('tetap mengirim kalau penyimpanan batas kirim mati', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const pembatas: Pembatas = { cek: () => Promise.reject(new Error('upstash mati')) }
    expect((await siapkan({ pembatas }).panggil(minta(valid))).status).toBe(202)
  })

  it('503 tanpa detail internal kalau pengirim gagal, dan tidak mencatat isi pesan', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    const kirim = () => Promise.reject(new Error('Resend menjawab 500'))
    const r = await siapkan({ kirim }).panggil(minta(valid))
    expect(r.status).toBe(503)
    const isi = await baca(r)
    expect(cocok('Galat', isi)).toBe(true)
    expect(isi.galat).toBe('LAYANAN_GAGAL')
    expect(JSON.stringify(isi)).not.toContain('Resend')
    const tercatat = JSON.stringify(log.mock.calls)
    for (const rahasia of [valid.email, valid.pesan, '203.0.113.7'])
      expect(tercatat).not.toContain(rahasia)
  })
})

describe('pembatasMemori', () => {
  it('jendela geser: kiriman lama lepas setelah satu jam', async () => {
    let t = 0
    const p = pembatasMemori(() => t)
    for (let i = 0; i < 5; i++) {
      expect(await p.cek('a')).toEqual({ boleh: true })
      t += 60_000
    }
    expect(await p.cek('a')).toEqual({ boleh: false, cobaLagiDetik: 3600 - 300 })
    t = 3600_000 + 1
    expect(await p.cek('a')).toEqual({ boleh: true })
  })
})

describe('kirimEmail lewat Resend', () => {
  const env = {
    RESEND_API_KEY: 'kunci-uji',
    KONTAK_TUJUAN: 'wingmanclutch@gmail.com',
    KONTAK_PENGIRIM: 'Wingman Clutch <onboarding@resend.dev>',
  }
  const kontak = { nama: 'Sari\nBcc: x@y.z', email: 'sari@contoh.com', pesan: '<b>halo</b> tim' }

  it('mengirim teks biasa dengan reply_to ke pengirim dan batas waktu 8 detik', async () => {
    const fetch = vi.fn(async () => new Response('{"id":"1"}', { status: 200 }))
    vi.stubGlobal('fetch', fetch)
    const timeout = vi.spyOn(AbortSignal, 'timeout')
    await kirimEmail(kontak, env)
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('https://api.resend.com/emails')
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer kunci-uji')
    const body = JSON.parse(String(init.body))
    expect(body).toMatchObject({
      from: env.KONTAK_PENGIRIM,
      to: [env.KONTAK_TUJUAN],
      reply_to: 'sari@contoh.com',
      subject: 'Ide dari Sari Bcc: x@y.z',
    })
    expect(body.html).toBeUndefined()
    expect(body.text).toContain('<b>halo</b> tim')
    expect(timeout).toHaveBeenCalledWith(BATAS_WAKTU_MS)
  })

  it('subjek tanpa baris baru dan nama dipotong 60 karakter', () => {
    expect(subjek('a'.repeat(80))).toBe(`Ide dari ${'a'.repeat(60)}`)
    expect(subjek('Sari\r\nWulan')).toBe('Ide dari Sari Wulan')
  })

  it('gagal kalau Resend menolak, tidak bisa dihubungi, atau env kosong', async () => {
    vi.stubGlobal('fetch', async () => new Response('{}', { status: 422 }))
    await expect(kirimEmail(kontak, env)).rejects.toThrow('422')
    vi.stubGlobal('fetch', () => Promise.reject(new DOMException('habis', 'TimeoutError')))
    await expect(kirimEmail(kontak, env)).rejects.toThrow('batas waktu')
    await expect(kirimEmail(kontak, {})).rejects.toThrow('env')
  })
})
