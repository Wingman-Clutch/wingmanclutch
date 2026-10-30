// Logika GET /api/proyek. Urutan langkahnya mengikuti docs/backend.md.

import { APLIKASI, ambilRepo, cekStatus, type DaftarStatistik, type Repo } from './github.js'
import { galat, json } from './jawab.js'

/** cache CDN: satu jam kalau lengkap, lima menit kalau sebagian repo gagal supaya cepat pulih */
export const CACHE_LENGKAP = 'public, s-maxage=3600, stale-while-revalidate=86400'
export const CACHE_SEBAGIAN = 'public, s-maxage=300, stale-while-revalidate=3600'

/** nilai terakhir yang berhasil di instance ini, dipakai kalau sebuah repo gagal */
const terakhir = new Map<string, Repo>()
export const lupakanTerakhir = () => terakhir.clear()

export async function tanganiProyek(req: Request, sekarang = () => new Date()): Promise<Response> {
  if (req.method !== 'GET')
    return json(405, undefined, { Allow: 'GET', 'Cache-Control': 'no-store' })

  const [repo, status] = await Promise.all([
    Promise.all(APLIKASI.map((a) => ambilRepo(a.repo))),
    Promise.all(APLIKASI.map((a) => cekStatus(a.url))),
  ])

  // simpan yang berhasil dulu, supaya repo lain yang gagal di permintaan ini tetap terbantu
  APLIKASI.forEach((a, i) => {
    const r = repo[i]
    if (r) terakhir.set(a.id, r)
  })
  const pakai = APLIKASI.map((a, i) => repo[i] ?? terakhir.get(a.id))

  // lebih baik baris statistik disembunyikan daripada menulis "★ 0 · baru saja"
  if (pakai.some((r) => !r))
    return galat(
      503,
      { galat: 'LAYANAN_GAGAL', pesan: 'Statistik GitHub sedang tidak bisa diambil.' },
      { 'Cache-Control': 'no-store' },
    )

  const isi: DaftarStatistik = {
    diperbarui: sekarang().toISOString(),
    proyek: APLIKASI.map((a, i) => ({ id: a.id, ...pakai[i]!, status: status[i]! })),
  }
  const lengkap = repo.every((r) => r !== null)
  return json(200, isi, { 'Cache-Control': lengkap ? CACHE_LENGKAP : CACHE_SEBAGIAN })
}
