// Aturan kolom form kontak, sama dengan kontrak dan periksaKontak di apps/web/src/api/kontrak.ts.

import type { GalatKolom } from './jawab.js'

export const BATAS = {
  nama: { min: 1, maks: 80 },
  email: { maks: 254 },
  pesan: { min: 10, maks: 2000 },
} as const

const POLA_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export interface Kontak {
  nama: string
  email: string
  pesan: string
}

/** pangkas spasi lalu cek; urutan galat sama dengan frontend */
export function periksaKontak(data: Record<string, unknown>): GalatKolom[] | Kontak {
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
  return galat.length ? galat : { nama, email, pesan }
}
