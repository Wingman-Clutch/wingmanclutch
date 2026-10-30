// Mock /api sesuai docs/api/openapi.yaml, supaya frontend jalan tanpa menunggu backend.
// Aktif di `pnpm dev` dan di build E2E (MOCK_API=1). Tidak pernah ikut build produksi.
//
// Pesan yang memuat kata kunci ini memicu jawaban galat, untuk mencoba tampilan dan E2E:
//   #gagal   503 LAYANAN_GAGAL (form jatuh ke email)
//   #sering  429 TERLALU_SERING

import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'
import { periksaKontak } from '../src/api/kontrak'
import type { DaftarStatistik, Galat } from '../src/api/kontrak'

function kirim(
  res: ServerResponse,
  status: number,
  isi: unknown,
  header: Record<string, string> = {},
) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  for (const [k, v] of Object.entries(header)) res.setHeader(k, v)
  res.end(isi === undefined ? '' : JSON.stringify(isi))
}

const BODY_MAKS = 16 * 1024

/** null kalau body lebih dari 16 KB */
function bacaBody(req: IncomingMessage): Promise<string | null> {
  return new Promise((ok, gagal) => {
    let isi = ''
    req.on('data', (c: Buffer) => {
      isi += c.toString('utf8')
      if (isi.length > BODY_MAKS) {
        ok(null)
        req.destroy()
      }
    })
    req.on('end', () => ok(isi))
    req.on('error', gagal)
  })
}

export const STATISTIK_MOCK: DaftarStatistik = {
  diperbarui: '2026-10-30T03:00:00Z',
  proyek: [
    { id: 'postpocket', bintang: 2, terakhirDiperbarui: '2026-10-26T15:56:00Z', status: 'online' },
    { id: 'tikoem', bintang: 2, terakhirDiperbarui: '2026-10-26T14:45:56Z', status: 'online' },
    { id: 'gorute', bintang: 1, terakhirDiperbarui: '2026-10-23T21:21:39Z', status: 'online' },
    { id: 'tookthel', bintang: 3, terakhirDiperbarui: '2026-10-26T15:01:10Z', status: 'gangguan' },
  ],
}

export async function jawabMock(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const url = new URL(req.url ?? '/', 'http://lokal')
  if (url.pathname === '/api/proyek') {
    if (req.method !== 'GET') {
      kirim(res, 405, undefined, { Allow: 'GET' })
      return true
    }
    kirim(res, 200, STATISTIK_MOCK, {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    })
    return true
  }
  if (url.pathname === '/api/kontak') {
    if (req.method !== 'POST') {
      kirim(res, 405, undefined, { Allow: 'POST' })
      return true
    }
    if (!String(req.headers['content-type'] ?? '').includes('application/json')) {
      kirim(res, 415, {
        galat: 'INPUT_TIDAK_VALID',
        pesan: 'Kirim sebagai application/json.',
      } satisfies Galat)
      return true
    }
    const body = await bacaBody(req)
    if (body === null) {
      kirim(res, 413, {
        galat: 'INPUT_TIDAK_VALID',
        pesan: 'Pesannya kepanjangan.',
      } satisfies Galat)
      return true
    }
    let data: Record<string, unknown>
    try {
      data = JSON.parse(body)
    } catch {
      kirim(res, 400, {
        galat: 'INPUT_TIDAK_VALID',
        pesan: 'Body bukan JSON yang valid.',
      } satisfies Galat)
      return true
    }
    // bot mengisi kolom jebakan: jawab seolah berhasil, tapi pesannya dibuang
    if (typeof data.situs === 'string' && data.situs.trim()) {
      kirim(res, 202, { status: 'terkirim' })
      return true
    }
    const kolom = periksaKontak(data)
    if (kolom.length) {
      kirim(res, 400, {
        galat: 'INPUT_TIDAK_VALID',
        pesan: 'Ada kolom yang belum benar.',
        kolom,
      } satisfies Galat)
      return true
    }
    const pesan = String(data.pesan)
    if (pesan.includes('#gagal')) {
      kirim(res, 503, {
        galat: 'LAYANAN_GAGAL',
        pesan: 'Pengirim email sedang tidak bisa dihubungi.',
      } satisfies Galat)
      return true
    }
    if (pesan.includes('#sering')) {
      kirim(
        res,
        429,
        {
          galat: 'TERLALU_SERING',
          pesan: 'Terlalu banyak pesan dari jaringan ini.',
          cobaLagiDetik: 600,
        } satisfies Galat,
        { 'Retry-After': '600' },
      )
      return true
    }
    kirim(res, 202, { status: 'terkirim' })
    return true
  }
  return false
}

export function mockApi(): Plugin {
  // Fungsi pemasang tidak boleh mengembalikan apa-apa: Vite menganggap nilai kembaliannya hook.
  const pasang = (server: {
    middlewares: {
      use: (f: (req: IncomingMessage, res: ServerResponse, next: () => void) => void) => unknown
    }
  }) => {
    server.middlewares.use((req, res, next) => {
      if (!req.url?.startsWith('/api/')) return next()
      jawabMock(req, res).then((dijawab) => {
        if (!dijawab)
          kirim(res, 404, { galat: 'LAYANAN_GAGAL', pesan: 'Endpoint tidak ada di kontrak.' })
      }, next)
    })
  }
  return {
    name: 'wingmanclutch-mock-api',
    configureServer: pasang,
    configurePreviewServer: pasang,
  }
}
