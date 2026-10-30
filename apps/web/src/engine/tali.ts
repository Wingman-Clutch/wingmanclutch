// Fisika lanyard: simpul Verlet, sambungan berpanjang tetap, dan putaran kartu di cincinnya.
// Diadaptasi dari Lanyard Badge karya Kedhareswer Naidu (lisensi MIT, teksnya di halaman/lanyard.ts).

/** satu simpul tali; `w` = kebalikan massa, 0 berarti dipaku di tempat */
export interface Simpul {
  x: number
  y: number
  px: number
  py: number
  w: number
}

/** [indeks a, indeks b, panjang diam] */
export type Sambungan = [number, number, number]

/** sudut kartu di cincin (radian) dan kecepatannya */
export interface Putaran {
  a: number
  v: number
}

/** satu langkah Verlet: kecepatan dari posisi sebelumnya, diredam, ditambah gravitasi */
export function langkahVerlet(simpul: Simpul[], dt: number, gravitasi: number, redam: number) {
  for (const p of simpul) {
    if (!p.w) continue
    const vx = (p.x - p.px) * redam
    const vy = (p.y - p.py) * redam
    p.px = p.x
    p.py = p.y
    p.x += vx
    p.y += vy + gravitasi * dt * dt
  }
}

/** kembalikan setiap sambungan ke panjang diamnya; simpul yang lebih berat bergeser lebih sedikit */
export function tegangkan(simpul: Simpul[], sambungan: Sambungan[], ulang: number) {
  for (let k = 0; k < ulang; k++) {
    for (const [i, j, diam] of sambungan) {
      const a = simpul[i]
      const b = simpul[j]
      const ws = a.w + b.w
      if (!ws) continue
      const dx = b.x - a.x
      const dy = b.y - a.y
      const d = Math.hypot(dx, dy) || 1e-6
      const f = (d - diam) / (d * ws)
      a.x += dx * f * a.w
      a.y += dy * f * a.w
      b.x -= dx * f * b.w
      b.y -= dy * f * b.w
    }
  }
}

/**
 * Putaran kartu di cincin. Pilinan tali menjadi pegas yang menarik kartu kembali ke `sasaran`;
 * `dorong` adalah apa pun yang sedang memutarnya (ayunan, lemparan, angin).
 */
export function langkahPutar(p: Putaran, sasaran: number, dt: number, dorong: number) {
  p.v += (-(p.a - sasaran) * 18 - p.v * 3.2 + dorong) * dt
  p.a += p.v * dt
}

/** seberapa jauh kartu berayun dari posisi tegak lurus ke bawah, dalam radian; ke kanan positif */
export function sudutAyun(atas: Simpul, bawah: Simpul) {
  return Math.atan2(bawah.x - atas.x, bawah.y - atas.y)
}
