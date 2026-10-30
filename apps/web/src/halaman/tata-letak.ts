// Tata letak halaman dalam satuan adegan. Garis kotak buku berjarak KOTAK satuan, dihitung dari
// garis0; `baris` menaruh garis dasar tulisan sebuah sketsa tepat di garis buku ke-n.
// Seluruh adegan selalu muat di layar (tanpa scroll), jadi di HP semuanya ikut mengecil.

export const KOTAK = 46

export interface TempatItem {
  x: number
  /** posisi atas dalam satuan adegan, atau pakai `baris` */
  y?: number
  baris?: number
  /** skala satuan gambar ke satuan adegan */
  s: number
  /** rotasi derajat */
  r?: number
}

export interface Pensil {
  c: 'w' | 'r' | 'b' | 'g' | 'p'
  x: number
  y: number
  panjang: number
  r: number
}

export interface TataLetak {
  W: number
  H: number
  garis0: number
  /** garis tanggal tercetak di kertas */
  tanggal: { x0: number; x1: number; y: number }
  /** noda cincin kopi: x, y, jari-jari, benih */
  noda: [number, number, number, number][]
  /** garis dasar teks kaki halaman */
  kaki: number
  pensil: Pensil[]
  /** tinggi area ketuk setiap pensil */
  tebalPensil: number
  penghapus: { x: number; y: number; w: number; h: number; r: number }
  item: Record<string, TempatItem>
}

const PENSIL_LANSKAP: Pensil[] = [
  { c: 'w', x: 420, y: 786, panjang: 270, r: -94 },
  { c: 'r', x: 484, y: 800, panjang: 226, r: -86 },
  { c: 'b', x: 548, y: 792, panjang: 244, r: -92 },
  { c: 'g', x: 612, y: 804, panjang: 214, r: -88 },
  { c: 'p', x: 676, y: 796, panjang: 232, r: -93 },
]

export const TATA: Record<'potret' | 'lanskap', TataLetak> = {
  potret: {
    W: 1000,
    H: 2180,
    garis0: 150,
    tanggal: { x0: 566, x1: 962, y: 104 },
    noda: [[880, 1520, 70, 3]],
    kaki: 2060,
    tebalPensil: 122,
    pensil: [
      { c: 'w', x: 162, y: 1880, panjang: 300, r: -95 },
      { c: 'r', x: 286, y: 1894, panjang: 248, r: -85 },
      { c: 'b', x: 410, y: 1886, panjang: 268, r: -93 },
      { c: 'g', x: 534, y: 1900, panjang: 236, r: -87 },
      { c: 'p', x: 658, y: 1892, panjang: 254, r: -94 },
    ],
    penghapus: { x: 858, y: 1940, w: 196, h: 84, r: -9 },
    item: {
      tentang: { x: 96, y: 14, s: 0.74, r: -5 },
      tanggal: { x: 664, y: 104, s: 0.86 },
      saklar: { x: 282, y: 26, s: 0.85 },
      logo: { x: 262, baris: 7.6, s: 0.54 },
      petunjukBawah: { x: 330, baris: 8.6, s: 0.86, r: -2 },
      postpocket: { x: 92, baris: 16.6, s: 1.45, r: -2 },
      gorute: { x: 556, baris: 16.6, s: 1.45, r: 2 },
      tikoem: { x: 100, baris: 25.4, s: 1.45, r: 2 },
      tookthel: { x: 548, baris: 25.4, s: 1.45, r: -2 },
      kilau1: { x: 456, y: 700, s: 1 },
      kilau2: { x: 452, y: 1120, s: 1.1, r: 20 },
      tim: { x: 385, baris: 29.6, s: 1.15, r: 1 },
      kontak: { x: 278, baris: 32.4, s: 0.852, r: -1 },
      petunjukPensil: { x: 690, baris: 35.3, s: 0.9, r: -2 },
    },
  },
  lanskap: {
    W: 1700,
    H: 1000,
    garis0: 120,
    tanggal: { x0: 1112, x1: 1430, y: 74 },
    noda: [[1562, 908, 60, 7]],
    kaki: 958,
    tebalPensil: 60,
    pensil: PENSIL_LANSKAP,
    penghapus: { x: 866, y: 880, w: 196, h: 84, r: -6 },
    item: {
      tentang: { x: 352, y: 22, s: 0.72, r: -6 },
      tanggal: { x: 1150, y: 74, s: 0.8 },
      saklar: { x: 1462, y: 6, s: 0.72 },
      logo: { x: 636, baris: 5.5, s: 0.49 },
      petunjukSamping: { x: 850, baris: 7.2, s: 0.88 },
      postpocket: { x: 92, baris: 7, s: 1.3, r: -3 },
      tikoem: { x: 110, baris: 15, s: 1.3, r: 2 },
      gorute: { x: 1334, baris: 7, s: 1.3, r: 2 },
      tookthel: { x: 1306, baris: 15, s: 1.3, r: -2 },
      kontak: { x: 628, baris: 10, s: 0.852, r: -1 },
      tim: { x: 1094, baris: 10, s: 1, r: 2 },
      petunjukPensil: { x: 748, baris: 14, s: 1, r: -2 },
      kopi: { x: 1050, y: 760, s: 0.8, r: 3 },
      rumus: { x: 396, baris: 10, s: 0.8, r: 2 },
      kilau1: { x: 470, y: 616, s: 1.1, r: 10 },
    },
  },
}

export function pilihTata(lebar: number, tinggi: number) {
  return lebar / tinggi < 0.92 ? 'potret' : 'lanskap'
}

export interface Ukuran {
  kunci: 'potret' | 'lanskap'
  L: TataLetak
  /** piksel per satuan adegan */
  k: number
  /** pojok kiri atas adegan di layar */
  kiri: number
  atas: number
}

export function hitungUkuran(lebar: number, tinggi: number): Ukuran {
  const kunci = pilihTata(lebar, tinggi)
  const L = TATA[kunci]
  const k = Math.min(lebar / L.W, tinggi / L.H)
  const kiri = (lebar - L.W * k) / 2
  const atas = Math.min((tinggi - L.H * k) * 0.25, 40)
  return { kunci, L, k, kiri, atas }
}

/** posisi atas teks kaki halaman dalam piksel; skrip di <head> index.html menghitung yang sama */
export function atasKaki(u: Ukuran) {
  return u.atas + (u.L.kaki - 14) * u.k
}

/** posisi atas item dalam satuan adegan; `dasar` = garis dasar tulisan item dalam satuan gambar */
export function atasItem(L: TataLetak, t: TempatItem, dasar: number) {
  if (t.baris !== undefined) return L.garis0 + t.baris * KOTAK - dasar * t.s
  return t.y ?? 0
}
