import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const DOMAIN = 'https://wingmanclutch.web.id'
const baca = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')

interface Pengalihan {
  source: string
  has?: { type: string; value: string }[]
  destination: string
  permanent: boolean
}
const { redirects } = JSON.parse(baca('../../../vercel.json')) as { redirects: Pengalihan[] }

/**
 * Pengalihan yang berlaku untuk sebuah host. Nilai host di `has` dibaca Vercel sebagai regex; di sini
 * sengaja tanpa ^ dan $, jadi lebih longgar dari Vercel: host yang tidak cocok di sini pasti tidak
 * cocok di sana.
 */
const dialihkan = (host: string) =>
  redirects.filter((r) => r.has?.some((h) => h.type === 'host' && new RegExp(h.value).test(host)))

describe('domain wingmanclutch.web.id', () => {
  it('alamat vercel.app dialihkan permanen ke domain, path ikut dibawa', () => {
    expect(dialihkan('wingmanclutch.vercel.app')).toEqual([
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'wingmanclutch.vercel.app' }],
        destination: `${DOMAIN}/:path*`,
        permanent: true,
      },
    ])
  })

  it('URL preview, URL deploy, dan domainnya sendiri tidak ikut dialihkan', () => {
    for (const host of [
      'wingmanclutch-git-feat-domain-web-id-haikalfaruqs-projects.vercel.app',
      'wingmanclutch-git-main-haikalfaruqs-projects.vercel.app',
      'wingmanclutch-haikalfaruqs-projects.vercel.app',
      'wingmanclutch-4f8k2h1qz-haikalfaruqs-projects.vercel.app',
      'wingmanclutch.web.id',
      'www.wingmanclutch.web.id',
      'localhost:5180',
    ])
      expect(dialihkan(host), host).toEqual([])
  })

  it('canonical dan Open Graph memakai domain', () => {
    const html = baca('../index.html')
    expect(html).toContain(`<link rel="canonical" href="${DOMAIN}/" />`)
    expect(html).toContain(`<meta property="og:url" content="${DOMAIN}/" />`)
    expect(html).toContain(`<meta property="og:image" content="${DOMAIN}/og.jpg" />`)
    expect(html).not.toContain('vercel.app')
  })
})
