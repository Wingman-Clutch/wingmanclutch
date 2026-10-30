// Logika POST /api/kontak. Urutan langkahnya mengikuti docs/backend.md.
// Dipisah dari api/kontak.ts supaya test bisa memberi pembatas dan pengirim tiruan.

import { ipDari, kunciIp, pembatasBawaan, type Pembatas } from './batas.js'
import { kirimEmail } from './email.js'
import { galat, json } from './jawab.js'
import { periksaKontak, type Kontak } from './validasi.js'

export const BODY_MAKS = 16 * 1024

export interface Kebutuhan {
  pembatas: Pembatas
  kirim: (kontak: Kontak) => Promise<void>
}

const TANPA_CACHE = { 'Cache-Control': 'no-store' }
const tidakValid = (status: number, pesan: string) =>
  galat(status, { galat: 'INPUT_TIDAK_VALID', pesan }, TANPA_CACHE)

/** isi body sebagai teks, atau null kalau lebih dari BODY_MAKS byte */
async function bacaBody(req: Request): Promise<string | null> {
  if (Number(req.headers.get('content-length') ?? 0) > BODY_MAKS) return null
  if (!req.body) return ''
  const potongan: Uint8Array[] = []
  let ukuran = 0
  for await (const bagian of req.body as unknown as AsyncIterable<Uint8Array>) {
    ukuran += bagian.byteLength
    if (ukuran > BODY_MAKS) return null
    potongan.push(bagian)
  }
  return Buffer.concat(potongan).toString('utf8')
}

export async function tanganiKontak(
  req: Request,
  { pembatas, kirim }: Kebutuhan = { pembatas: pembatasBawaan(), kirim: kirimEmail },
): Promise<Response> {
  if (req.method !== 'POST') return json(405, undefined, { Allow: 'POST', ...TANPA_CACHE })

  const tipe = req.headers.get('content-type') ?? ''
  if (tipe.split(';')[0]!.trim().toLowerCase() !== 'application/json')
    return tidakValid(415, 'Kirim sebagai application/json.')

  const body = await bacaBody(req)
  if (body === null) return tidakValid(413, 'Pesannya kepanjangan.')

  let data: unknown
  try {
    data = JSON.parse(body)
  } catch {
    return tidakValid(400, 'Body bukan JSON yang valid.')
  }
  if (typeof data !== 'object' || data === null || Array.isArray(data))
    return tidakValid(400, 'Body harus berupa objek JSON.')
  const isi = data as Record<string, unknown>

  // bot mengisi kolom jebakan: jawab seolah berhasil, tapi pesannya dibuang
  if (typeof isi.situs === 'string' && isi.situs.trim())
    return json(202, { status: 'terkirim' }, TANPA_CACHE)

  const hasil = periksaKontak(isi)
  if (Array.isArray(hasil))
    return galat(
      400,
      { galat: 'INPUT_TIDAK_VALID', pesan: 'Ada kolom yang belum benar.', kolom: hasil },
      TANPA_CACHE,
    )

  const batas = await pembatas.cek(kunciIp(ipDari(req))).catch((e: unknown) => {
    // Upstash mati jangan sampai menutup form; catat tanpa data pengunjung
    console.error('batas kirim gagal dicek:', e instanceof Error ? e.message : 'galat')
    return { boleh: true } as const
  })
  if (!batas.boleh)
    return galat(
      429,
      {
        galat: 'TERLALU_SERING',
        pesan: 'Terlalu banyak pesan dari jaringan ini. Coba lagi nanti.',
        cobaLagiDetik: batas.cobaLagiDetik,
      },
      { 'Retry-After': String(batas.cobaLagiDetik), ...TANPA_CACHE },
    )

  try {
    await kirim(hasil)
  } catch (e) {
    console.error('kirim email gagal:', e instanceof Error ? e.message : 'galat')
    return galat(
      503,
      { galat: 'LAYANAN_GAGAL', pesan: 'Pengirim email sedang tidak bisa dihubungi.' },
      TANPA_CACHE,
    )
  }
  return json(202, { status: 'terkirim' }, TANPA_CACHE)
}
