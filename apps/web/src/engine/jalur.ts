// Path SVG jadi polyline, plus bentuk-bentuk dasar untuk menulis sketsa.
// Semua koordinat dalam satuan gambar (sketsa perangkat dirancang di kotak 200 x 200).

export type Titik = [number, number]
export type Garis = Titik[]
/** Matriks afin [a, b, c, d, e, f]: x' = a x + c y + e, y' = b x + d y + f */
export type Matriks = [number, number, number, number, number, number]

const LANGKAH = 2.5

function jumlahLangkah(panjangKasar: number) {
  return Math.max(2, Math.min(64, Math.ceil(panjangKasar / LANGKAH)))
}

function busur(
  x1: number,
  y1: number,
  rx: number,
  ry: number,
  rotasi: number,
  besar: boolean,
  searah: boolean,
  x2: number,
  y2: number,
  keluar: Garis,
) {
  // Konversi busur SVG (titik ujung) ke bentuk pusat, lalu dibagi rata.
  if (rx === 0 || ry === 0) {
    keluar.push([x2, y2])
    return
  }
  rx = Math.abs(rx)
  ry = Math.abs(ry)
  const phi = (rotasi * Math.PI) / 180
  const cos = Math.cos(phi)
  const sin = Math.sin(phi)
  const dx = (x1 - x2) / 2
  const dy = (y1 - y2) / 2
  const x1p = cos * dx + sin * dy
  const y1p = -sin * dx + cos * dy
  const lambda = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry)
  if (lambda > 1) {
    rx *= Math.sqrt(lambda)
    ry *= Math.sqrt(lambda)
  }
  const tanda = besar === searah ? -1 : 1
  const atas = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p
  const bawah = rx * rx * y1p * y1p + ry * ry * x1p * x1p
  const k = tanda * Math.sqrt(Math.max(0, atas / bawah))
  const cxp = (k * rx * y1p) / ry
  const cyp = (-k * ry * x1p) / rx
  const cx = cos * cxp - sin * cyp + (x1 + x2) / 2
  const cy = sin * cxp + cos * cyp + (y1 + y2) / 2
  const sudut = (ux: number, uy: number, vx: number, vy: number) => {
    const a = Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy)
    return a
  }
  const t1 = sudut(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry)
  let dt = sudut((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry)
  if (!searah && dt > 0) dt -= Math.PI * 2
  if (searah && dt < 0) dt += Math.PI * 2
  const n = jumlahLangkah(Math.abs(dt) * Math.max(rx, ry))
  for (let i = 1; i <= n; i++) {
    const t = t1 + (dt * i) / n
    const ex = rx * Math.cos(t)
    const ey = ry * Math.sin(t)
    keluar.push([cx + cos * ex - sin * ey, cy + sin * ex + cos * ey])
  }
}

/** Urai atribut d SVG jadi daftar polyline. Subpath tertutup (Z) diakhiri titik awalnya. */
export function uraiPath(d: string): Garis[] {
  const token = d.match(/[a-zA-Z]|-?(?:\d*\.\d+|\d+\.?)(?:e-?\d+)?/g) ?? []
  const hasil: Garis[] = []
  let garis: Garis = []
  let i = 0
  let perintah = ''
  let x = 0
  let y = 0
  let awalX = 0
  let awalY = 0
  let kendaliX = 0
  let kendaliY = 0
  let perintahLalu = ''
  const angka = () => parseFloat(token[i++])
  const tutup = () => {
    if (garis.length > 1) hasil.push(garis)
    garis = []
  }
  while (i < token.length) {
    if (/[a-zA-Z]/.test(token[i])) perintah = token[i++]
    const rel = perintah === perintah.toLowerCase()
    const P = perintah.toUpperCase()
    const bx = rel ? x : 0
    const by = rel ? y : 0
    switch (P) {
      case 'M': {
        tutup()
        x = bx + angka()
        y = by + angka()
        awalX = x
        awalY = y
        garis.push([x, y])
        // Pasangan angka berikutnya setelah M adalah L.
        perintah = rel ? 'l' : 'L'
        break
      }
      case 'L':
        x = bx + angka()
        y = by + angka()
        garis.push([x, y])
        break
      case 'H':
        x = bx + angka()
        garis.push([x, y])
        break
      case 'V':
        y = by + angka()
        garis.push([x, y])
        break
      case 'C':
      case 'S': {
        let x1: number
        let y1: number
        if (P === 'C') {
          x1 = bx + angka()
          y1 = by + angka()
        } else {
          const ulang = perintahLalu === 'C' || perintahLalu === 'S'
          x1 = ulang ? 2 * x - kendaliX : x
          y1 = ulang ? 2 * y - kendaliY : y
        }
        const x2 = bx + angka()
        const y2 = by + angka()
        const ex = bx + angka()
        const ey = by + angka()
        const kasar =
          Math.hypot(x1 - x, y1 - y) + Math.hypot(x2 - x1, y2 - y1) + Math.hypot(ex - x2, ey - y2)
        const n = jumlahLangkah(kasar)
        for (let k = 1; k <= n; k++) {
          const t = k / n
          const u = 1 - t
          garis.push([
            u * u * u * x + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * ex,
            u * u * u * y + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * ey,
          ])
        }
        kendaliX = x2
        kendaliY = y2
        x = ex
        y = ey
        break
      }
      case 'Q':
      case 'T': {
        let x1: number
        let y1: number
        if (P === 'Q') {
          x1 = bx + angka()
          y1 = by + angka()
        } else {
          const ulang = perintahLalu === 'Q' || perintahLalu === 'T'
          x1 = ulang ? 2 * x - kendaliX : x
          y1 = ulang ? 2 * y - kendaliY : y
        }
        const ex = bx + angka()
        const ey = by + angka()
        const n = jumlahLangkah(Math.hypot(x1 - x, y1 - y) + Math.hypot(ex - x1, ey - y1))
        for (let k = 1; k <= n; k++) {
          const t = k / n
          const u = 1 - t
          garis.push([
            u * u * x + 2 * u * t * x1 + t * t * ex,
            u * u * y + 2 * u * t * y1 + t * t * ey,
          ])
        }
        kendaliX = x1
        kendaliY = y1
        x = ex
        y = ey
        break
      }
      case 'A': {
        const rx = angka()
        const ry = angka()
        const rot = angka()
        const besar = angka() !== 0
        const searah = angka() !== 0
        const ex = bx + angka()
        const ey = by + angka()
        busur(x, y, rx, ry, rot, besar, searah, ex, ey, garis)
        x = ex
        y = ey
        break
      }
      case 'Z':
        if (garis.length && (x !== awalX || y !== awalY)) garis.push([awalX, awalY])
        x = awalX
        y = awalY
        tutup()
        garis.push([x, y])
        break
      default:
        // Token yang tidak dikenal dilewati supaya satu salah ketik tidak merusak satu sketsa.
        i++
    }
    perintahLalu = P
  }
  tutup()
  return hasil
}

// ---------- bentuk dasar (mengembalikan string d) ----------

const f = (n: number) => +n.toFixed(2)

export function lingkaran(cx: number, cy: number, r: number) {
  return elips(cx, cy, r, r)
}

export function elips(cx: number, cy: number, rx: number, ry: number) {
  return `M${f(cx - rx)} ${f(cy)}A${f(rx)} ${f(ry)} 0 1 0 ${f(cx + rx)} ${f(cy)}A${f(rx)} ${f(ry)} 0 1 0 ${f(cx - rx)} ${f(cy)}Z`
}

/** persegi panjang dengan sudut membulat */
export function kotak(x: number, y: number, w: number, h: number, r = 0) {
  r = Math.min(r, w / 2, h / 2)
  if (r <= 0) return `M${f(x)} ${f(y)}H${f(x + w)}V${f(y + h)}H${f(x)}Z`
  return (
    `M${f(x + r)} ${f(y)}H${f(x + w - r)}Q${f(x + w)} ${f(y)} ${f(x + w)} ${f(y + r)}` +
    `V${f(y + h - r)}Q${f(x + w)} ${f(y + h)} ${f(x + w - r)} ${f(y + h)}` +
    `H${f(x + r)}Q${f(x)} ${f(y + h)} ${f(x)} ${f(y + h - r)}V${f(y + r)}Q${f(x)} ${f(y)} ${f(x + r)} ${f(y)}Z`
  )
}

/** kilau bintang empat sudut */
export function kilau(cx: number, cy: number, r: number) {
  const k = r * 0.22
  return (
    `M${f(cx)} ${f(cy - r)}Q${f(cx + k)} ${f(cy - k)} ${f(cx + r)} ${f(cy)}` +
    `Q${f(cx + k)} ${f(cy + k)} ${f(cx)} ${f(cy + r)}Q${f(cx - k)} ${f(cy + k)} ${f(cx - r)} ${f(cy)}` +
    `Q${f(cx - k)} ${f(cy - k)} ${f(cx)} ${f(cy - r)}Z`
  )
}

/** garis bergelombang dari x0 ke x1 di ketinggian y */
export function gelombang(x0: number, x1: number, y: number, tinggi: number, panjangGel: number) {
  const n = Math.max(1, Math.round((x1 - x0) / panjangGel))
  const lebar = (x1 - x0) / n
  let d = `M${f(x0)} ${f(y)}`
  for (let i = 0; i < n; i++) {
    const a = x0 + i * lebar
    d += `Q${f(a + lebar / 4)} ${f(y - tinggi)} ${f(a + lebar / 2)} ${f(y)}Q${f(a + (3 * lebar) / 4)} ${f(y + tinggi)} ${f(a + lebar)} ${f(y)}`
  }
  return d
}

/** garis putus-putus */
export function putus(x0: number, y0: number, x1: number, y1: number, isi: number, jeda: number) {
  const l = Math.hypot(x1 - x0, y1 - y0)
  const ux = (x1 - x0) / l
  const uy = (y1 - y0) / l
  let d = ''
  for (let s = 0; s < l; s += isi + jeda) {
    const e = Math.min(l, s + isi)
    d += `M${f(x0 + ux * s)} ${f(y0 + uy * s)}L${f(x0 + ux * e)} ${f(y0 + uy * e)}`
  }
  return d
}

/** kepala panah di (x, y) yang menunjuk ke arah sudut (derajat) */
export function kepalaPanah(x: number, y: number, sudut: number, ukuran: number) {
  const a = (sudut * Math.PI) / 180
  const kiri = a + Math.PI * 0.82
  const kanan = a - Math.PI * 0.82
  return (
    `M${f(x + Math.cos(kiri) * ukuran)} ${f(y + Math.sin(kiri) * ukuran)}L${f(x)} ${f(y)}` +
    `L${f(x + Math.cos(kanan) * ukuran)} ${f(y + Math.sin(kanan) * ukuran)}`
  )
}

// ---------- matriks ----------

export const IDENTITAS: Matriks = [1, 0, 0, 1, 0, 0]

export function kali(m: Matriks, n: Matriks): Matriks {
  return [
    m[0] * n[0] + m[2] * n[1],
    m[1] * n[0] + m[3] * n[1],
    m[0] * n[2] + m[2] * n[3],
    m[1] * n[2] + m[3] * n[3],
    m[0] * n[4] + m[2] * n[5] + m[4],
    m[1] * n[4] + m[3] * n[5] + m[5],
  ]
}

export const geser = (x: number, y: number, s = 1): Matriks => [s, 0, 0, s, x, y]

/** putar sebesar derajat di sekitar (cx, cy) */
export function putar(derajat: number, cx = 0, cy = 0): Matriks {
  const a = (derajat * Math.PI) / 180
  const c = Math.cos(a)
  const s = Math.sin(a)
  return [c, s, -s, c, cx - c * cx + s * cy, cy - s * cx - c * cy]
}

export function terapkan(m: Matriks, g: Garis): Garis {
  return g.map(([x, y]) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]])
}

export function skalaMatriks(m: Matriks) {
  return Math.sqrt(Math.abs(m[0] * m[3] - m[1] * m[2]))
}

// ---------- ukur ----------

export function panjangGaris(g: Garis) {
  let l = 0
  for (let i = 1; i < g.length; i++) l += Math.hypot(g[i][0] - g[i - 1][0], g[i][1] - g[i - 1][1])
  return l
}

/** sampel ulang polyline dengan jarak antartitik kira-kira `jarak` */
export function sampelUlang(g: Garis, jarak: number): Garis {
  if (g.length < 2) return g.slice()
  const hasil: Garis = [g[0]]
  let sisa = jarak
  for (let i = 1; i < g.length; i++) {
    const [ax, ay] = g[i - 1]
    const [bx, by] = g[i]
    const l = Math.hypot(bx - ax, by - ay)
    let t = 0
    while (l - t >= sisa) {
      t += sisa
      hasil.push([ax + ((bx - ax) * t) / l, ay + ((by - ay) * t) / l])
      sisa = jarak
    }
    sisa -= l - t
  }
  const akhir = g[g.length - 1]
  const lalu = hasil[hasil.length - 1]
  if (Math.hypot(akhir[0] - lalu[0], akhir[1] - lalu[1]) > jarak * 0.2)
    hasil.push([akhir[0], akhir[1]])
  return hasil
}
