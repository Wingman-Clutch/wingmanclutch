// Pemanggil /api. Di development dan E2E dijawab mock (mock/api.ts); di produksi oleh Vercel
// Functions milik backend. Kalau backend belum ada, halaman tetap jalan: kontak jatuh ke email.

import type { DaftarStatistik, Galat, PesanKontak } from './kontrak'

const DASAR = (import.meta.env.VITE_API_BASE as string | undefined) ?? ''

export type HasilKontak =
  | { jenis: 'terkirim' }
  | { jenis: 'tidak_valid'; galat: Galat }
  | { jenis: 'terlalu_sering'; cobaLagiDetik: number }
  | { jenis: 'gagal' }

export async function kirimKontak(data: PesanKontak): Promise<HasilKontak> {
  let res: Response
  try {
    res = await fetch(`${DASAR}/api/kontak`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(12000),
    })
  } catch {
    return { jenis: 'gagal' }
  }
  if (res.status === 202) return { jenis: 'terkirim' }
  const isi = (await res.json().catch(() => null)) as Galat | null
  if (res.status === 400 && isi?.galat === 'INPUT_TIDAK_VALID')
    return { jenis: 'tidak_valid', galat: isi }
  if (res.status === 429) {
    const detik = isi?.cobaLagiDetik ?? Number(res.headers.get('Retry-After') ?? 60)
    return { jenis: 'terlalu_sering', cobaLagiDetik: Number.isFinite(detik) ? detik : 60 }
  }
  return { jenis: 'gagal' }
}

let statistik: Promise<DaftarStatistik | null> | null = null

/** statistik dari GitHub dan cek status, diambil sekali per kunjungan */
export function ambilStatistik() {
  statistik ??= fetch(`${DASAR}/api/proyek`, { signal: AbortSignal.timeout(8000) })
    .then((r) => (r.ok ? (r.json() as Promise<DaftarStatistik>) : null))
    .catch(() => null)
  return statistik
}
