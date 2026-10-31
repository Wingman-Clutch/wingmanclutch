import { expect, test } from '@playwright/test'
import { PROYEK } from '../src/data/proyek'
import { skema } from '../test/skema'

// Backend produksi dicek terhadap kontrak. Kiriman ke /api/kontak sengaja salah: server menolaknya
// sebelum batas kirim dan Resend, jadi tidak ada email yang terkirim dan kuota tidak terpakai.

test('/api/proyek: statistik keempat aplikasi sesuai kontrak', async ({ request }) => {
  const r = await request.get('/api/proyek')
  expect(r.status()).toBe(200)
  const isi = await r.json()
  const daftar = skema('DaftarStatistik')
  expect(daftar(isi), JSON.stringify(daftar.errors)).toBe(true)
  expect(isi.proyek.map((p: { id: string }) => p.id).sort()).toEqual(PROYEK.map((p) => p.id).sort())

  const post = await request.post('/api/proyek')
  expect(post.status()).toBe(405)
  expect(post.headers().allow).toBe('GET')
})

test('/api/kontak: kiriman yang salah ditolak sesuai kontrak', async ({ request }) => {
  const get = await request.get('/api/kontak')
  expect(get.status()).toBe(405)
  expect(get.headers().allow).toBe('POST')

  const galat = skema('Galat')
  const teks = await request.post('/api/kontak', {
    headers: { 'content-type': 'text/plain' },
    data: 'halo',
  })
  expect(teks.status()).toBe(415)
  expect(galat(await teks.json()), JSON.stringify(galat.errors)).toBe(true)

  const kosong = await request.post('/api/kontak', {
    data: { nama: '', email: '', pesan: '', situs: '' },
  })
  expect(kosong.status()).toBe(400)
  const isi = await kosong.json()
  expect(galat(isi), JSON.stringify(galat.errors)).toBe(true)
  expect(isi.galat).toBe('INPUT_TIDAK_VALID')
  expect(isi.kolom.map((k: { kolom: string }) => k.kolom).sort()).toEqual([
    'email',
    'nama',
    'pesan',
  ])
})
