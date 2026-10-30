// Batas kirim form kontak: 5 pesan per jam per jaringan, jendela geser.
// Produksi memakai Upstash Redis supaya batasnya sama di semua instance Functions.
// Kalau env Upstash kosong (lokal), jatuh ke batas di memori per instance.

import { createHash } from 'node:crypto'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

export const KIRIM_PER_JAM = 5
const JENDELA_MS = 60 * 60 * 1000

export type HasilBatas = { boleh: true } | { boleh: false; cobaLagiDetik: number }

export interface Pembatas {
  cek(kunci: string): Promise<HasilBatas>
}

/** kunci batas kirim: IP tidak pernah dipakai atau disimpan mentah */
export function kunciIp(ip: string, garam = process.env.GARAM_IP ?? '') {
  return createHash('sha256')
    .update(garam + ip)
    .digest('hex')
}

/** IP pengunjung dari x-forwarded-for paling kiri, yang diisi Vercel */
export function ipDari(req: Request) {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'tanpa-ip'
}

const detikSampai = (ms: number, sekarang: number) => Math.max(1, Math.ceil((ms - sekarang) / 1000))

export function pembatasMemori(sekarang = () => Date.now()): Pembatas {
  const catatan = new Map<string, number[]>()
  return {
    async cek(kunci) {
      const t = sekarang()
      const daftar = (catatan.get(kunci) ?? []).filter((w) => w > t - JENDELA_MS)
      if (daftar.length >= KIRIM_PER_JAM) {
        catatan.set(kunci, daftar)
        return { boleh: false, cobaLagiDetik: detikSampai(daftar[0]! + JENDELA_MS, t) }
      }
      daftar.push(t)
      catatan.set(kunci, daftar)
      return { boleh: true }
    },
  }
}

export function pembatasUpstash(url: string, token: string): Pembatas {
  const ratelimit = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(KIRIM_PER_JAM, '1 h'),
    prefix: 'wingmanclutch:kontak',
    analytics: false,
  })
  return {
    async cek(kunci) {
      const hasil = await ratelimit.limit(kunci)
      return hasil.success
        ? { boleh: true }
        : { boleh: false, cobaLagiDetik: detikSampai(hasil.reset, Date.now()) }
    },
  }
}

let pembatas: Pembatas | undefined

/** satu pembatas per instance; Upstash kalau env-nya ada */
export function pembatasBawaan(): Pembatas {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  pembatas ??= url && token ? pembatasUpstash(url, token) : pembatasMemori()
  return pembatas
}
