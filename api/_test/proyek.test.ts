import { readFileSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { APLIKASI, BATAS_WAKTU_MS, ambilRepo, cekStatus } from '../_lib/github.js'
import { CACHE_LENGKAP, CACHE_SEBAGIAN, lupakanTerakhir, tanganiProyek } from '../_lib/proyek.js'
import type { DaftarStatistik } from '../_lib/github.js'
import { cocok, kontrak } from './kontrak.js'

const SEKARANG = new Date('2026-10-30T03:00:00Z')
const minta = (method = 'GET') => new Request('http://lokal/api/proyek', { method })
const panggil = (req = minta()) => tanganiProyek(req, () => SEKARANG)
const baca = (r: Response) => r.json() as Promise<DaftarStatistik>

type Jawab = (url: string, init: RequestInit) => Response | Promise<Response>

/** fetch tiruan: GitHub menjawab repo, aplikasi menjawab HEAD */
function tiru({ github, aplikasi }: { github?: Jawab; aplikasi?: Jawab } = {}) {
  const fetch = vi.fn(async (masukan: string | URL, init: RequestInit = {}) => {
    const url = String(masukan)
    if (url.startsWith('https://api.github.com/repos/')) {
      if (github) return github(url, init)
      const nama = url.split('/').pop()!
      return Response.json({ stargazers_count: nama.length, pushed_at: '2026-10-26T15:56:00Z' })
    }
    if (aplikasi) return aplikasi(url, init)
    return new Response(null, { status: 200 })
  })
  vi.stubGlobal('fetch', fetch)
  return fetch
}

beforeEach(() => {
  lupakanTerakhir()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe('GET /api/proyek', () => {
  it('200 dengan cache CDN satu jam, urutan id sama dengan kontrak', async () => {
    tiru()
    const r = await panggil()
    expect(r.status).toBe(200)
    expect(r.headers.get('content-type')).toBe('application/json; charset=utf-8')
    expect(r.headers.get('cache-control')).toBe(CACHE_LENGKAP)
    const isi = await baca(r)
    expect(cocok('DaftarStatistik', isi)).toBe(true)
    expect(isi.diperbarui).toBe(SEKARANG.toISOString())
    expect(isi.proyek.map((p) => p.id)).toEqual(
      kontrak.components.schemas.StatistikProyek.properties.id.enum,
    )
    expect(isi.proyek[0]).toEqual({
      id: 'postpocket',
      bintang: 'PostPocket'.length,
      terakhirDiperbarui: '2026-10-26T15:56:00.000Z',
      status: 'online',
    })
  })

  it('memanggil GitHub dan keempat aplikasi bersamaan', async () => {
    let aktif = 0
    let puncak = 0
    const tunda = async (hasil: Response) => {
      puncak = Math.max(puncak, ++aktif)
      await new Promise((ok) => setTimeout(ok, 5))
      aktif--
      return hasil
    }
    tiru({
      github: () =>
        tunda(Response.json({ stargazers_count: 1, pushed_at: SEKARANG.toISOString() })),
      aplikasi: () => tunda(new Response(null, { status: 200 })),
    })
    await panggil()
    expect(puncak).toBe(8)
  })

  it('memakai token GitHub kalau ada, dan tanpa Authorization kalau tidak', async () => {
    const fetch = tiru()
    vi.stubEnv('GITHUB_TOKEN', 'token-uji')
    await panggil()
    const header = (i: number) =>
      (fetch.mock.calls[i]![1] as RequestInit).headers as Record<string, string>
    expect(header(0).Authorization).toBe('Bearer token-uji')
    expect(header(0)['User-Agent']).toBeTruthy()
    fetch.mockClear()
    vi.stubEnv('GITHUB_TOKEN', '')
    await panggil()
    expect(header(0).Authorization).toBeUndefined()
  })

  it('status: 2xx dan 3xx online, 5xx dan lewat waktu gangguan', async () => {
    const kode: Record<string, number | 'putus'> = {
      'https://postpocket.vercel.app/': 200,
      'https://tikoem.vercel.app/': 308,
      'https://gorute.vercel.app/': 503,
      'https://tookthel.vercel.app/': 'putus',
    }
    const fetch = tiru({
      aplikasi: (url) => {
        const k = kode[url]!
        if (k === 'putus') throw new DOMException('habis', 'TimeoutError')
        return new Response(null, { status: k })
      },
    })
    const isi = await baca(await panggil())
    expect(isi.proyek.map((p) => p.status)).toEqual(['online', 'online', 'gangguan', 'gangguan'])
    const head = fetch.mock.calls.find(([u]) => String(u).includes('postpocket.vercel.app'))!
    expect(head[1]).toMatchObject({ method: 'HEAD', redirect: 'manual' })
  })

  it('GitHub gagal sebagian: data yang ada tetap dikirim dengan cache lebih pendek', async () => {
    tiru({
      github: (url) =>
        url.endsWith('/tikoem')
          ? new Response('{}', { status: 403 })
          : Response.json({ stargazers_count: 4, pushed_at: '2026-10-20T00:00:00Z' }),
    })
    const r = await panggil()
    expect(r.status).toBe(200)
    expect(r.headers.get('cache-control')).toBe(CACHE_SEBAGIAN)
    const isi = await baca(r)
    expect(cocok('DaftarStatistik', isi)).toBe(true)
    expect(isi.proyek.find((p) => p.id === 'tikoem')).toEqual({
      id: 'tikoem',
      bintang: 0,
      terakhirDiperbarui: SEKARANG.toISOString(),
      status: 'online',
    })
    expect(isi.proyek.find((p) => p.id === 'gorute')!.bintang).toBe(4)
  })

  it('GitHub gagal sebagian: pakai nilai terakhir yang berhasil di instance ini', async () => {
    tiru()
    await panggil()
    tiru({
      github: (url) =>
        url.endsWith('/tikoem')
          ? Promise.reject(new Error('putus'))
          : Response.json({ stargazers_count: 9, pushed_at: '2026-10-29T00:00:00Z' }),
    })
    const isi = await baca(await panggil())
    expect(isi.proyek.find((p) => p.id === 'tikoem')).toMatchObject({
      bintang: 'tikoem'.length,
      terakhirDiperbarui: '2026-10-26T15:56:00.000Z',
    })
  })

  it('503 tanpa cache kalau GitHub gagal untuk semua repo', async () => {
    tiru({ github: () => new Response('{}', { status: 500 }) })
    const r = await panggil()
    expect(r.status).toBe(503)
    expect(r.headers.get('cache-control')).toBe('no-store')
    const isi = await r.json()
    expect(cocok('Galat', isi)).toBe(true)
    expect(isi).toMatchObject({ galat: 'LAYANAN_GAGAL' })
  })

  it('405 dengan Allow: GET untuk metode lain', async () => {
    const fetch = tiru()
    const r = await panggil(minta('POST'))
    expect(r.status).toBe(405)
    expect(r.headers.get('allow')).toBe('GET')
    expect(fetch).not.toHaveBeenCalled()
  })
})

describe('ambilRepo dan cekStatus', () => {
  it('jawaban GitHub yang tidak lengkap dianggap gagal', async () => {
    tiru({ github: () => Response.json({ stargazers_count: '2' }) })
    expect(await ambilRepo('Wingman-Clutch/tikoem')).toBeNull()
  })

  it('batas waktu 5 detik untuk GitHub dan cek status', async () => {
    tiru()
    const timeout = vi.spyOn(AbortSignal, 'timeout')
    await ambilRepo('Wingman-Clutch/tikoem')
    await cekStatus('https://tikoem.vercel.app')
    expect(timeout.mock.calls).toEqual([[BATAS_WAKTU_MS], [BATAS_WAKTU_MS]])
  })

  it('URL yang tidak bisa dicek menjadi tidak_diketahui', async () => {
    expect(await cekStatus('bukan url')).toBe('tidak_diketahui')
  })
})

describe('daftar aplikasi sama dengan halaman', () => {
  const data = readFileSync(new URL('../../apps/web/src/data/proyek.ts', import.meta.url), 'utf8')

  it('id, repo, dan URL produksi sama dengan apps/web/src/data/proyek.ts', () => {
    for (const a of APLIKASI) {
      expect(data).toContain(`id: '${a.id}'`)
      expect(data).toContain(`url: '${a.url}'`)
      expect(data).toContain(`repo: 'https://github.com/${a.repo}'`)
    }
    expect(data.match(/^\s{4}id: '/gm)).toHaveLength(APLIKASI.length)
  })
})
