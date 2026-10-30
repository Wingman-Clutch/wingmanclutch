// Kertas buku: garis kotak tercetak, kolom TANGGAL, noda cincin kopi, dan butiran kertas.

import { buatAcak } from '../engine/acak'
import type { Tema } from '../engine/kuas'
import { DPR } from '../engine/sketsa'
import { KOTAK, type Ukuran } from './tata-letak'

interface Kertas {
  warna: string
  kotak: string
  cetak: string
  /** warna noda kopi, null kalau tidak ada noda */
  noda: [number, number, number] | null
}

export const KERTAS: Record<Tema, Kertas> = {
  terang: {
    warna: '#f7f6f1',
    kotak: 'rgba(52, 64, 96, 0.13)',
    cetak: '#5d6271',
    noda: [140, 92, 48],
  },
  gelap: {
    warna: '#161922',
    kotak: 'rgba(214, 222, 240, 0.075)',
    cetak: '#8c93a6',
    noda: [196, 150, 104],
  },
  matrix: { warna: '#020604', kotak: 'rgba(60, 255, 140, 0.07)', cetak: '#2bd46b', noda: null },
}

function cincinKopi(
  g: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  benih: number,
  warna: [number, number, number],
) {
  const acak = buatAcak(benih)
  const [cr, cg, cb] = warna
  // genangan tipis di dalam
  const isi = g.createRadialGradient(cx, cy, r * 0.2, cx, cy, r)
  isi.addColorStop(0, `rgba(${cr},${cg},${cb},0.035)`)
  isi.addColorStop(0.85, `rgba(${cr},${cg},${cb},0.06)`)
  isi.addColorStop(1, `rgba(${cr},${cg},${cb},0)`)
  g.fillStyle = isi
  g.beginPath()
  g.arc(cx, cy, r, 0, Math.PI * 2)
  g.fill()
  // tepi cincin yang lebih pekat dan tidak rata
  for (let lap = 0; lap < 2; lap++) {
    const rr = r * (lap ? 0.93 : 1)
    const n = 120
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2
      const a1 = ((i + 1.2) / n) * Math.PI * 2
      const alfa =
        (0.05 + 0.12 * Math.abs(Math.sin(a0 * 1.5 + benih))) * (lap ? 0.5 : 1) * acak(0.7, 1.2)
      g.strokeStyle = `rgba(${cr},${cg},${cb},${alfa.toFixed(3)})`
      g.lineWidth = Math.max(1, r * acak(0.025, 0.05))
      g.beginPath()
      g.arc(cx + acak(-0.6, 0.6), cy + acak(-0.6, 0.6), rr + acak(-0.8, 0.8), a0, a1)
      g.stroke()
    }
  }
}

/** gambar ulang kertas sesuai ukuran layar dan tema */
export function gambarKertas(kanvas: HTMLCanvasElement, u: Ukuran, tema: Tema) {
  const lebar = kanvas.clientWidth
  const tinggi = kanvas.clientHeight
  const dpr = DPR()
  kanvas.width = Math.ceil(lebar * dpr)
  kanvas.height = Math.ceil(tinggi * dpr)
  const g = kanvas.getContext('2d')!
  g.setTransform(dpr, 0, 0, dpr, 0, 0)
  const P = KERTAS[tema]
  g.fillStyle = P.warna
  g.fillRect(0, 0, lebar, tinggi)

  // garis kotak, sejajar dengan garis buku di adegan
  const jarak = KOTAK * u.k
  const y0 = u.atas + u.L.garis0 * u.k
  const x0 = u.kiri
  g.strokeStyle = P.kotak
  g.lineWidth = 1
  g.beginPath()
  for (let x = x0 - Math.ceil(x0 / jarak) * jarak; x < lebar; x += jarak) {
    g.moveTo(Math.round(x) + 0.5, 0)
    g.lineTo(Math.round(x) + 0.5, tinggi)
  }
  for (let y = y0 - Math.ceil(y0 / jarak) * jarak; y < tinggi; y += jarak) {
    g.moveTo(0, Math.round(y) + 0.5)
    g.lineTo(lebar, Math.round(y) + 0.5)
  }
  g.stroke()

  // kolom TANGGAL tercetak
  const T = u.L.tanggal
  const tx0 = u.kiri + T.x0 * u.k
  const tx1 = u.kiri + T.x1 * u.k
  const ty = u.atas + T.y * u.k
  g.fillStyle = P.cetak
  g.font = `600 ${Math.max(7, 13 * u.k)}px ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif`
  g.letterSpacing = `${(1.4 * u.k).toFixed(2)}px`
  const label = 'TANGGAL'
  const lebarLabel = g.measureText(label).width
  g.fillText(label, tx0 - lebarLabel - 10 * u.k, ty - 1)
  g.letterSpacing = '0px'
  g.strokeStyle = P.cetak
  g.globalAlpha = 0.6
  g.lineWidth = Math.max(1, 1.3 * u.k)
  g.beginPath()
  g.moveTo(tx0, ty + 2 * u.k)
  g.lineTo(tx1, ty + 2 * u.k)
  g.stroke()
  g.globalAlpha = 1

  if (P.noda) {
    for (const [x, y, r, benih] of u.L.noda) {
      cincinKopi(g, u.kiri + x * u.k, u.atas + y * u.k, r * u.k, benih, P.noda)
    }
  }
}

/** ubin butiran kertas untuk latar belakang CSS (dipasang sekali) */
export function ubinButiran(): string {
  const N = 192
  const c = document.createElement('canvas')
  c.width = c.height = N
  const g = c.getContext('2d')!
  const img = g.createImageData(N, N)
  const acak = buatAcak(42)
  for (let i = 0; i < N * N; i++) {
    const v = acak()
    const terang = v > 0.5
    const kuat = Math.abs(v - 0.5) * 2
    img.data[i * 4] = terang ? 255 : 0
    img.data[i * 4 + 1] = terang ? 255 : 0
    img.data[i * 4 + 2] = terang ? 255 : 0
    img.data[i * 4 + 3] = Math.round(kuat * kuat * 26)
  }
  g.putImageData(img, 0, 0)
  // serat kertas
  g.lineCap = 'round'
  for (let i = 0; i < 46; i++) {
    const x = acak(10, N - 10)
    const y = acak(10, N - 10)
    const a = acak(0, Math.PI * 2)
    const l = acak(5, 16)
    g.strokeStyle = `rgba(110, 100, 80, ${acak(0.04, 0.09).toFixed(3)})`
    g.lineWidth = acak(0.4, 0.9)
    g.beginPath()
    g.moveTo(x, y)
    g.quadraticCurveTo(
      x + Math.cos(a + 0.6) * l * 0.5,
      y + Math.sin(a + 0.6) * l * 0.5,
      x + Math.cos(a) * l,
      y + Math.sin(a) * l,
    )
    g.stroke()
  }
  return c.toDataURL()
}
