// Angka acak yang bisa diulang. Setiap sketsa punya benih sendiri, jadi goresannya selalu sama
// setiap kali digambar ulang (ganti tema, ubah ukuran layar, atau setelah dihapus).

export interface Acak {
  /** angka di antara a dan b */
  (a?: number, b?: number): number
}

/** xorshift32: cepat, cukup acak untuk goyangan tangan */
export function buatAcak(benih: number): Acak {
  let s = benih >>> 0 || 0x9e3779b9
  const lanjut = () => {
    s ^= s << 13
    s >>>= 0
    s ^= s >>> 17
    s ^= s << 5
    s >>>= 0
    return s / 4294967296
  }
  return (a = 0, b = 1) => a + (b - a) * lanjut()
}

/** FNV-1a untuk mengubah nama sketsa jadi benih */
export function hashTeks(teks: string): number {
  let h = 2166136261
  for (let i = 0; i < teks.length; i++) {
    h ^= teks.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export const batasi = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v)
