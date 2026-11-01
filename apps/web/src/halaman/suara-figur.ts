// Bunyi di dalam figur interaktif. Iframe-nya satu origin, jadi tombol dan seretannya didengarkan
// dari halaman induk: engine Colorfigures tidak berubah, dan uisfx tetap hanya dimuat sekali.

import type { CueName } from 'uisfx'
import type { IdProyek } from '../data/proyek'
import { BERTUMPUK, BUNYI, BUNYI_LANGKAH, Butiran, suara } from './suara'

/** satu detak setiap sejauh ini (piksel) figur diputar, dan selang terpendek antardetak (ms) */
const JARAK_DETAK = 28
const SELANG_DETAK = 70

const BUNYI_UKURAN: Record<string, CueName> = {
  zi: BUNYI.perbesarFigur,
  zm: BUNYI.perkecilFigur,
  zp: BUNYI.ukuranFigur,
}

function cueTombol(b: Element, id: IdProyek): CueName {
  const langkah: Record<string, CueName> = BUNYI_LANGKAH[id]
  const khusus = langkah[b.textContent?.trim() ?? ''] ?? BUNYI_UKURAN[b.className]
  if (khusus) return khusus
  const tekan = b.getAttribute('aria-pressed')
  if (tekan === null) return BUNYI.tombolFigur
  return tekan === 'true' ? BUNYI.pilihanNyala : BUNYI.pilihanMati
}

/** pasang sekali setelah halaman figur dimuat; pendengarnya ikut hilang bersama iframe-nya */
export function pasangSuaraFigur(isi: Document, id: IdProyek) {
  // engine sudah menjalankan tombolnya saat klik sampai di sini, jadi aria-pressed sudah yang baru
  isi.addEventListener('click', (e) => {
    const b = (e.target as Element).closest('button')
    if (b) suara.mainkan(cueTombol(b, id))
  })

  const detak = new Butiran(JARAK_DETAK, SELANG_DETAK)
  let seret: { id: number; x: number; y: number; berdetak: boolean } | null = null
  isi.addEventListener('pointerdown', (e) => {
    const t = e.target as Element
    if (e.button || t.closest('button, [data-act]') || !t.closest('#fig')) return
    seret = { id: e.pointerId, x: e.clientX, y: e.clientY, berdetak: false }
  })
  isi.addEventListener('pointermove', (e) => {
    if (seret?.id !== e.pointerId) return
    const d = Math.hypot(e.clientX - seret.x, e.clientY - seret.y)
    seret.x = e.clientX
    seret.y = e.clientY
    if (!detak.maju(d)) return
    seret.berdetak = true
    suara.mainkan(BUNYI.putarFigur, { ...BERTUMPUK, volume: 0.1 })
  })
  const lepas = (e: PointerEvent) => {
    if (seret?.id !== e.pointerId) return
    if (seret.berdetak) suara.mainkan(BUNYI.lepasFigur)
    seret = null
  }
  isi.addEventListener('pointerup', lepas)
  isi.addEventListener('pointercancel', lepas)
}
