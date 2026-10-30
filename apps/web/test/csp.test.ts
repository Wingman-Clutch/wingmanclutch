import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8')

describe('Content-Security-Policy', () => {
  it('hash di CSP sama dengan skrip tema di index.html', () => {
    // Kalau skrip pemilih tema diubah, hash di meta CSP wajib ikut diganti (lihat pesan galat).
    const skrip = html.match(/<script>([\s\S]*?)<\/script>/)![1]
    const hash = createHash('sha256').update(skrip).digest('base64')
    const csp = html.match(/http-equiv="Content-Security-Policy"\s+content="([^"]+)"/)![1]
    expect(csp, `ganti hash di CSP jadi 'sha256-${hash}'`).toContain(`'sha256-${hash}'`)
  })

  it('tidak mengizinkan skrip inline lain atau domain luar', () => {
    const csp = html.match(/http-equiv="Content-Security-Policy"\s+content="([^"]+)"/)![1]
    expect(csp).not.toContain("script-src 'self' 'unsafe-inline'")
    expect(csp).not.toMatch(/https?:/)
  })
})
