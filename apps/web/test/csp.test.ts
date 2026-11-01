import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe.each(['index.html', '404.html'])('Content-Security-Policy %s', (berkas) => {
  const html = readFileSync(new URL(`../${berkas}`, import.meta.url), 'utf8')
  const csp = html.match(/http-equiv="Content-Security-Policy"\s+content="([^"]+)"/)![1]

  it('hash di CSP sama dengan skrip tema', () => {
    // Kalau skrip pemilih tema diubah, hash di meta CSP wajib ikut diganti (lihat pesan galat).
    const skrip = html.match(/<script>([\s\S]*?)<\/script>/)![1]
    const hash = createHash('sha256').update(skrip).digest('base64')
    expect(csp, `ganti hash di CSP jadi 'sha256-${hash}'`).toContain(`'sha256-${hash}'`)
  })

  it('tidak mengizinkan skrip inline lain atau domain luar', () => {
    expect(csp).not.toContain("script-src 'self' 'unsafe-inline'")
    expect(csp).not.toMatch(/https?:/)
  })
})
