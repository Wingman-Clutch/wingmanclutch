import { readFileSync } from 'node:fs'
import { getTransformedRoutes, isHandler, type Redirect } from '@vercel/routing-utils'
import { describe, expect, it } from 'vitest'

const DOMAIN = 'https://wingmanclutch.web.id'
const baca = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')

const { redirects } = JSON.parse(baca('../../../vercel.json')) as { redirects: Redirect[] }
const { routes, error } = getTransformedRoutes({ redirects })

/**
 * Status dan tujuan pengalihan untuk sebuah host dan path, atau null kalau tidak dialihkan. Path
 * dicocokkan dengan rute hasil kompilasi library routing Vercel sendiri, karena Vercel mencocokkan
 * source secara ketat: `/:path*` misalnya tidak cocok dengan `/`. Nilai host di `has` dibaca Vercel
 * sebagai regex; di sini sengaja tanpa ^ dan $, jadi lebih longgar dari Vercel: host yang tidak cocok
 * di sini pasti tidak cocok di sana.
 */
function alihkan(host: string, path: string) {
  for (const r of routes ?? []) {
    if (isHandler(r) || !r.status || !r.headers?.Location) continue
    const hostCocok = (r.has ?? []).every(
      (h) => h.type === 'host' && typeof h.value === 'string' && new RegExp(h.value).test(host),
    )
    const cocok = hostCocok && path.match(new RegExp(r.src))
    if (cocok)
      return {
        status: r.status,
        ke: r.headers.Location.replace(/\$(\d+)/g, (_, i) => cocok[+i] ?? ''),
      }
  }
  return null
}

describe('domain wingmanclutch.web.id', () => {
  it('alamat vercel.app dialihkan permanen ke domain, termasuk halaman utama', () => {
    expect(error).toBeNull()
    for (const path of ['/', '/apa', '/a/b/', '/api/proyek', '/figur/aplikasi.html'])
      expect(alihkan('wingmanclutch.vercel.app', path), path).toEqual({
        status: 308,
        ke: `${DOMAIN}${path}`,
      })
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
      for (const path of ['/', '/apa']) expect(alihkan(host, path), host + path).toBeNull()
  })

  it('canonical dan Open Graph memakai domain', () => {
    const html = baca('../index.html')
    expect(html).toContain(`<link rel="canonical" href="${DOMAIN}/" />`)
    expect(html).toContain(`<meta property="og:url" content="${DOMAIN}/" />`)
    expect(html).toContain(`<meta property="og:image" content="${DOMAIN}/og.jpg" />`)
    expect(html).not.toContain('vercel.app')
  })
})
