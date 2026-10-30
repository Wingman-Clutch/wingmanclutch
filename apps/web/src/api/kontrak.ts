// Bentuk data /api sesuai docs/api/openapi.yaml. Kalau kontrak berubah, ubah keduanya di PR yang sama.

import type { IdProyek } from '../data/proyek'

export interface PesanKontak {
  nama: string
  email: string
  pesan: string
  /** jebakan bot: manusia tidak melihat kolom ini, jadi harus kosong */
  situs: string
}

export type KolomKontak = 'nama' | 'email' | 'pesan'

export interface GalatKolom {
  kolom: KolomKontak
  alasan: 'wajib' | 'terlalu_pendek' | 'terlalu_panjang' | 'format'
}

export type KodeGalat = 'INPUT_TIDAK_VALID' | 'TERLALU_SERING' | 'LAYANAN_GAGAL'

export interface Galat {
  galat: KodeGalat
  pesan: string
  kolom?: GalatKolom[]
  cobaLagiDetik?: number
}

export interface StatistikProyek {
  id: IdProyek
  bintang: number
  terakhirDiperbarui: string
  status: 'online' | 'gangguan' | 'tidak_diketahui'
}

export interface DaftarStatistik {
  diperbarui: string
  proyek: StatistikProyek[]
}

export const BATAS = {
  nama: { min: 1, maks: 80 },
  email: { maks: 254 },
  pesan: { min: 10, maks: 2000 },
} as const

const POLA_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** aturan yang sama dengan backend; dipakai form sebelum mengirim dan oleh mock API */
export function periksaKontak(data: Partial<Record<keyof PesanKontak, unknown>>): GalatKolom[] {
  const galat: GalatKolom[] = []
  const teks = (v: unknown) => (typeof v === 'string' ? v.trim() : '')
  const nama = teks(data.nama)
  const email = teks(data.email)
  const pesan = teks(data.pesan)
  if (!nama) galat.push({ kolom: 'nama', alasan: 'wajib' })
  else if (nama.length > BATAS.nama.maks) galat.push({ kolom: 'nama', alasan: 'terlalu_panjang' })
  if (!email) galat.push({ kolom: 'email', alasan: 'wajib' })
  else if (email.length > BATAS.email.maks)
    galat.push({ kolom: 'email', alasan: 'terlalu_panjang' })
  else if (!POLA_EMAIL.test(email)) galat.push({ kolom: 'email', alasan: 'format' })
  if (!pesan) galat.push({ kolom: 'pesan', alasan: 'wajib' })
  else if (pesan.length < BATAS.pesan.min) galat.push({ kolom: 'pesan', alasan: 'terlalu_pendek' })
  else if (pesan.length > BATAS.pesan.maks)
    galat.push({ kolom: 'pesan', alasan: 'terlalu_panjang' })
  return galat
}

const KATA_KOLOM: Record<KolomKontak, string> = { nama: 'Nama', email: 'Email', pesan: 'Pesan' }
const KATA_ALASAN: Record<GalatKolom['alasan'], string> = {
  wajib: 'belum diisi',
  terlalu_pendek: `minimal ${BATAS.pesan.min} karakter`,
  terlalu_panjang: 'kepanjangan',
  format: 'formatnya belum benar',
}
export const kalimatGalat = (g: GalatKolom) => `${KATA_KOLOM[g.kolom]} ${KATA_ALASAN[g.alasan]}.`
