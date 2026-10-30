// Kirim pesan form kontak lewat Resend (https://resend.com/docs/api-reference/emails/send-email).
// Isinya teks biasa: tidak ada HTML yang dirakit dari input pengunjung.

import type { Kontak } from './validasi.js'

const RESEND = 'https://api.resend.com/emails'
export const BATAS_WAKTU_MS = 8000

export class GagalKirim extends Error {}

export function subjek(nama: string) {
  return `Ide dari ${nama.replace(/[\r\n]+/g, ' ').slice(0, 60)}`
}

export async function kirimEmail(kontak: Kontak, env = process.env): Promise<void> {
  const { RESEND_API_KEY, KONTAK_TUJUAN, KONTAK_PENGIRIM } = env
  if (!RESEND_API_KEY || !KONTAK_TUJUAN || !KONTAK_PENGIRIM)
    throw new GagalKirim('env Resend belum lengkap')
  let res: Response
  try {
    res = await fetch(RESEND, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: KONTAK_PENGIRIM,
        to: [KONTAK_TUJUAN],
        reply_to: kontak.email,
        subject: subjek(kontak.nama),
        text: `${kontak.pesan}\n\n--\n${kontak.nama}\n${kontak.email}\n\nDikirim dari form kontak wingmanclutch.vercel.app`,
      }),
      signal: AbortSignal.timeout(BATAS_WAKTU_MS),
    })
  } catch {
    throw new GagalKirim('Resend tidak bisa dihubungi atau lewat batas waktu')
  }
  // hanya status yang dicatat, tidak pernah isi pesan atau alamat
  if (!res.ok) throw new GagalKirim(`Resend menjawab ${res.status}`)
}
