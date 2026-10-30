import { afterEach, describe, expect, it, vi } from 'vitest'

const limit = vi.fn()
vi.mock('@upstash/ratelimit', () => {
  class Ratelimit {
    static slidingWindow = (n: number, w: string) => ({ n, w })
    constructor(public opsi: unknown) {}
    limit = limit
  }
  return { Ratelimit }
})

const { pembatasBawaan, pembatasUpstash } = await import('../_lib/batas.js')

afterEach(() => vi.unstubAllEnvs())

describe('pembatasUpstash', () => {
  it('meneruskan kunci ke Upstash dan mengubah reset jadi detik', async () => {
    vi.useFakeTimers({ now: 1_000_000 })
    const p = pembatasUpstash('https://contoh.upstash.io', 'token-uji')
    limit.mockResolvedValueOnce({ success: true, reset: 0 })
    expect(await p.cek('kunci')).toEqual({ boleh: true })
    limit.mockResolvedValueOnce({ success: false, reset: 1_000_000 + 90_500 })
    expect(await p.cek('kunci')).toEqual({ boleh: false, cobaLagiDetik: 91 })
    expect(limit).toHaveBeenCalledWith('kunci')
    vi.useRealTimers()
  })

  it('dipakai kalau env Upstash ada', async () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://contoh.upstash.io')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'token-uji')
    limit.mockResolvedValueOnce({ success: false, reset: Date.now() + 5000 })
    expect(await pembatasBawaan().cek('x')).toMatchObject({ boleh: false })
  })
})

describe('kunciIp', () => {
  it('memperingatkan sekali kalau GARAM_IP kosong di production', async () => {
    const { kunciIp } = await import('../_lib/batas.js')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.stubEnv('VERCEL_ENV', 'preview')
    kunciIp('203.0.113.7', '')
    expect(warn).not.toHaveBeenCalled()
    vi.stubEnv('VERCEL_ENV', 'production')
    kunciIp('203.0.113.7', 'garam')
    expect(warn).not.toHaveBeenCalled()
    kunciIp('203.0.113.7', '')
    kunciIp('203.0.113.8', '')
    expect(warn).toHaveBeenCalledTimes(1)
    expect(JSON.stringify(warn.mock.calls)).not.toContain('203.0.113')
    warn.mockRestore()
  })
})
