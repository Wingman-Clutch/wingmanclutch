// Statistik GET /api/proyek: star dan pushed_at dari GitHub, plus cek status URL produksi.
// Daftar aplikasi harus sama dengan apps/web/src/data/proyek.ts (dijaga _test/proyek.test.ts).

export type IdProyek = 'postpocket' | 'tikoem' | 'gorute' | 'tookthel'
export type Status = 'online' | 'gangguan' | 'tidak_diketahui'

export interface StatistikProyek {
  id: IdProyek
  bintang: number
  terakhirDiperbarui: string
  status: Status
}

export interface DaftarStatistik {
  diperbarui: string
  proyek: StatistikProyek[]
}

/** urutan id mengikuti enum StatistikProyek.id di kontrak */
export const APLIKASI: { id: IdProyek; repo: string; url: string }[] = [
  { id: 'postpocket', repo: 'Wingman-Clutch/PostPocket', url: 'https://postpocket.vercel.app' },
  { id: 'tikoem', repo: 'Wingman-Clutch/tikoem', url: 'https://tikoem.vercel.app' },
  { id: 'gorute', repo: 'Wingman-Clutch/goRute', url: 'https://gorute.vercel.app' },
  { id: 'tookthel', repo: 'Wingman-Clutch/tookthel', url: 'https://tookthel.vercel.app' },
]

export const BATAS_WAKTU_MS = 5000

export interface Repo {
  bintang: number
  terakhirDiperbarui: string
}

/** star dan pushed_at satu repo, atau null kalau GitHub gagal */
export async function ambilRepo(
  repo: string,
  token = process.env.GITHUB_TOKEN,
): Promise<Repo | null> {
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}`, {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'wingmanclutch-api',
        'X-GitHub-Api-Version': '2022-11-28',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      signal: AbortSignal.timeout(BATAS_WAKTU_MS),
    })
    if (!res.ok) {
      console.error(`GitHub menjawab ${res.status} untuk ${repo}`)
      return null
    }
    const data = (await res.json()) as { stargazers_count?: unknown; pushed_at?: unknown }
    const bintang = data.stargazers_count
    const pushed = data.pushed_at
    if (
      typeof bintang !== 'number' ||
      typeof pushed !== 'string' ||
      Number.isNaN(Date.parse(pushed))
    )
      return null
    return { bintang, terakhirDiperbarui: new Date(pushed).toISOString() }
  } catch {
    console.error(`GitHub tidak bisa dihubungi untuk ${repo}`)
    return null
  }
}

/** HEAD ke URL produksi: 2xx/3xx online, galat atau lewat 5 detik gangguan */
export async function cekStatus(url: string): Promise<Status> {
  let alamat: URL
  try {
    alamat = new URL(url)
  } catch {
    return 'tidak_diketahui'
  }
  try {
    const res = await fetch(alamat, {
      method: 'HEAD',
      redirect: 'manual',
      signal: AbortSignal.timeout(BATAS_WAKTU_MS),
    })
    return res.status >= 200 && res.status < 400 ? 'online' : 'gangguan'
  } catch {
    return 'gangguan'
  }
}
