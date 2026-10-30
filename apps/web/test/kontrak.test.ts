import { readFileSync } from 'node:fs'
import { EventEmitter } from 'node:events'
import type { IncomingMessage, ServerResponse } from 'node:http'
import Ajv2020 from 'ajv/dist/2020'
import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'
import { jawabMock, STATISTIK_MOCK } from '../mock/api'
import { periksaKontak } from '../src/api/kontrak'
import { PROYEK } from '../src/data/proyek'

const kontrak = parse(
  readFileSync(new URL('../../../docs/api/openapi.yaml', import.meta.url), 'utf8'),
)
const ajv = new Ajv2020({ strict: false, allErrors: true })
ajv.addFormat('email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/)
ajv.addFormat('date-time', (s: string) => !Number.isNaN(Date.parse(s)))
ajv.addSchema({ $id: 'kontrak', components: kontrak.components })
const skema = (nama: string) => ajv.getSchema(`kontrak#/components/schemas/${nama}`)!

/** jalankan mock seperti server sungguhan dan kembalikan status, header, dan body */
async function panggil(method: string, url: string, body?: unknown, tipe = 'application/json') {
  const req = Object.assign(new EventEmitter(), {
    method,
    url,
    headers: { 'content-type': tipe },
    destroy() {},
  }) as unknown as IncomingMessage
  const header: Record<string, string> = {}
  let isi = ''
  const res = {
    statusCode: 200,
    setHeader: (k: string, v: string) => (header[k.toLowerCase()] = v),
    end: (s: string) => (isi = s),
  } as unknown as ServerResponse
  const jalan = jawabMock(req, res)
  queueMicrotask(() => {
    if (body !== undefined)
      req.emit('data', Buffer.from(typeof body === 'string' ? body : JSON.stringify(body)))
    req.emit('end')
  })
  await jalan
  return { status: res.statusCode, header, json: isi ? JSON.parse(isi) : undefined }
}

const valid = {
  nama: 'Sari',
  email: 'sari@contoh.com',
  pesan: 'Mau bikin aplikasi kasir.',
  situs: '',
}

describe('periksaKontak', () => {
  it('lolos untuk pesan yang lengkap', () => {
    expect(periksaKontak(valid)).toEqual([])
  })

  it('menandai kolom kosong, email salah, dan pesan pendek', () => {
    expect(periksaKontak({ nama: '  ', email: 'sari', pesan: 'hai' })).toEqual([
      { kolom: 'nama', alasan: 'wajib' },
      { kolom: 'email', alasan: 'format' },
      { kolom: 'pesan', alasan: 'terlalu_pendek' },
    ])
  })

  it('menolak teks yang kepanjangan', () => {
    const g = periksaKontak({ ...valid, nama: 'x'.repeat(81), pesan: 'y'.repeat(2001) })
    expect(g.map((x) => x.alasan)).toEqual(['terlalu_panjang', 'terlalu_panjang'])
  })

  it('sama dengan skema kontrak untuk contoh yang valid', () => {
    expect(skema('PesanKontak')(valid)).toBe(true)
    expect(skema('PesanKontak')({ ...valid, email: 'bukan-email' })).toBe(false)
  })
})

describe('mock /api/kontak mengikuti kontrak', () => {
  it('202 untuk pesan valid', async () => {
    const r = await panggil('POST', '/api/kontak', valid)
    expect(r.status).toBe(202)
    expect(skema('Terkirim')(r.json)).toBe(true)
  })

  it('400 dengan daftar kolom untuk pesan yang belum benar', async () => {
    const r = await panggil('POST', '/api/kontak', { ...valid, email: 'x' })
    expect(r.status).toBe(400)
    expect(skema('Galat')(r.json)).toBe(true)
    expect(r.json.kolom).toEqual([{ kolom: 'email', alasan: 'format' }])
  })

  it('202 tapi dibuang kalau jebakan bot terisi', async () => {
    const r = await panggil('POST', '/api/kontak', { ...valid, email: 'x', situs: 'http://spam' })
    expect(r.status).toBe(202)
  })

  it('429 dengan Retry-After dan 503 untuk pemicu galat', async () => {
    const sering = await panggil('POST', '/api/kontak', { ...valid, pesan: 'tolong #sering ya' })
    expect(sering.status).toBe(429)
    expect(sering.header['retry-after']).toBe(String(sering.json.cobaLagiDetik))
    expect(skema('Galat')(sering.json)).toBe(true)
    const gagal = await panggil('POST', '/api/kontak', { ...valid, pesan: 'tolong #gagal ya' })
    expect(gagal.status).toBe(503)
    expect(skema('Galat')(gagal.json)).toBe(true)
  })

  it('415, 413, 400, dan 405 untuk permintaan yang salah bentuk', async () => {
    expect((await panggil('POST', '/api/kontak', 'nama=sari', 'text/plain')).status).toBe(415)
    expect((await panggil('POST', '/api/kontak', 'x'.repeat(17_000))).status).toBe(413)
    expect((await panggil('POST', '/api/kontak', '{rusak')).status).toBe(400)
    const r = await panggil('GET', '/api/kontak')
    expect(r.status).toBe(405)
    expect(r.header.allow).toBe('POST')
  })
})

describe('mock /api/proyek mengikuti kontrak', () => {
  it('200 dengan cache CDN dan satu baris per aplikasi', async () => {
    const r = await panggil('GET', '/api/proyek')
    expect(r.status).toBe(200)
    expect(r.header['cache-control']).toContain('s-maxage=3600')
    expect(skema('DaftarStatistik')(r.json)).toBe(true)
    expect(STATISTIK_MOCK.proyek.map((p) => p.id).sort()).toEqual(PROYEK.map((p) => p.id).sort())
  })

  it('id aplikasi di kontrak sama dengan data halaman', () => {
    expect([...kontrak.components.schemas.StatistikProyek.properties.id.enum].sort()).toEqual(
      PROYEK.map((p) => p.id).sort(),
    )
  })
})
