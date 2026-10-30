// Satu requestAnimationFrame untuk semua yang bergerak: sketsa yang sedang digambar, penghapus,
// remah, dan hujan Matrix. Loop berhenti sendiri kalau tidak ada kerjaan.

export const GERAK_DIKURANGI =
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

export interface Tugas {
  mulai: number
  durasi: number
  langkah: (p: number) => void
  selesai?: () => void
}

const tugas = new Set<Tugas>()
const pengait = new Set<(t: number, dt: number) => boolean | void>()
let raf = 0
let lalu = 0

function detak(t: number) {
  raf = 0
  const dt = Math.min(0.05, Math.max(0, (t - lalu) / 1000))
  lalu = t
  for (const j of tugas) {
    if (t < j.mulai) continue
    const p = j.durasi <= 0 ? 1 : Math.min(1, (t - j.mulai) / j.durasi)
    j.langkah(p)
    if (p >= 1) {
      tugas.delete(j)
      j.selesai?.()
    }
  }
  for (const h of pengait) if (h(t, dt) === false) pengait.delete(h)
  if (tugas.size || pengait.size) raf = requestAnimationFrame(detak)
}

function tendang() {
  if (!raf) {
    lalu = performance.now()
    raf = requestAnimationFrame(detak)
  }
}

/** jalankan langkah(p) dengan p 0..1 selama durasi ms, setelah tunda ms */
export function jadwalkan(
  tunda: number,
  durasi: number,
  langkah: (p: number) => void,
  selesai?: () => void,
) {
  const j: Tugas = {
    mulai: performance.now() + (GERAK_DIKURANGI ? 0 : tunda),
    durasi: GERAK_DIKURANGI ? 0 : durasi,
    langkah,
    selesai,
  }
  tugas.add(j)
  tendang()
  return j
}

export function batalkan(j: Tugas | undefined | null) {
  if (j) tugas.delete(j)
}

/** dipanggil setiap frame sampai mengembalikan false atau dicabut */
export function kaitkan(h: (t: number, dt: number) => boolean | void) {
  pengait.add(h)
  tendang()
  return () => pengait.delete(h)
}
