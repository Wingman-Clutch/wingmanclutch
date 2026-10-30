// Foto tim jadi sketsa pensil: abu-abu, kontras otomatis, lalu teknik color dodge
// (abu-abu dibagi kebalikan versi buramnya) dan arsiran tipis di bagian yang gelap.

import { buatAcak } from '../engine/acak'

function buram(data: Float32Array, w: number, h: number, r: number) {
  // box blur dua arah, diulang dua kali supaya mendekati gaussian
  const tmp = new Float32Array(data.length)
  const lewat = (src: Float32Array, dst: Float32Array, datar: boolean) => {
    for (let a = 0; a < (datar ? h : w); a++) {
      let jumlah = 0
      const n = datar ? w : h
      const ambil = (b: number) => {
        const i = Math.min(n - 1, Math.max(0, b))
        return datar ? src[a * w + i] : src[i * w + a]
      }
      for (let b = -r; b <= r; b++) jumlah += ambil(b)
      for (let b = 0; b < n; b++) {
        if (datar) dst[a * w + b] = jumlah / (2 * r + 1)
        else dst[b * w + a] = jumlah / (2 * r + 1)
        jumlah += ambil(b + r + 1) - ambil(b - r)
      }
    }
  }
  for (let k = 0; k < 2; k++) {
    lewat(data, tmp, true)
    lewat(tmp, data, false)
  }
}

export async function sketsaFoto(src: string, kanvas: HTMLCanvasElement, sisi = 240) {
  const img = new Image()
  img.decoding = 'async'
  img.src = src
  await img.decode()
  kanvas.width = kanvas.height = sisi
  const g = kanvas.getContext('2d', { willReadFrequently: true })!
  g.drawImage(img, 0, 0, sisi, sisi)
  const data = g.getImageData(0, 0, sisi, sisi)
  const n = sisi * sisi
  const abu = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const d = data.data
    abu[i] = (0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2]) / 255
  }
  // kontras otomatis dari persentil 2 dan 98, supaya foto gelap tetap terbaca
  const urut = Array.from(abu).sort((a, b) => a - b)
  const lo = urut[Math.floor(n * 0.02)]
  const hi = urut[Math.floor(n * 0.98)]
  const rentang = Math.max(0.05, hi - lo)
  for (let i = 0; i < n; i++) abu[i] = Math.min(1, Math.max(0, (abu[i] - lo) / rentang))
  const balik = new Float32Array(n)
  for (let i = 0; i < n; i++) balik[i] = 1 - abu[i]
  buram(balik, sisi, sisi, Math.round(sisi / 40))
  const acak = buatAcak(9)
  for (let i = 0; i < n; i++) {
    // color dodge: garis tepi jadi gelap, bidang rata jadi putih kertas
    let v = Math.min(1, abu[i] / Math.max(0.02, 1 - balik[i]))
    v = Math.pow(v, 1.6)
    const x = i % sisi
    const y = (i / sisi) | 0
    // arsiran diagonal di bagian gelap
    const gelap = 1 - abu[i]
    if (gelap > 0.45 && (x + y) % 5 === 0) v *= 1 - (gelap - 0.45) * 0.9
    if (gelap > 0.75 && (x - y + 400) % 6 === 0) v *= 0.7
    v = Math.min(1, Math.max(0, v + (acak() - 0.5) * 0.06))
    const nilai = 34 + v * (250 - 34)
    data.data[i * 4] = nilai
    data.data[i * 4 + 1] = nilai * 0.995
    data.data[i * 4 + 2] = nilai * 0.98
    data.data[i * 4 + 3] = 255
  }
  g.putImageData(data, 0, 0)
}
