// Tulisan pensil di halaman 404.

import type { Op } from '../engine/goresan'
import { judul, tulis } from '../engine/huruf'

/** tinggi angka 404 dalam satuan gambar */
export const TINGGI_ANGKA = 300

export function angka(): Op[] {
  return judul('404', 0, TINGGI_ANGKA, TINGGI_ANGKA, { rata: 'c', bayang: 'p' })
}

export function keterangan(): Op[] {
  return [tulis('HALAMAN INI KEHAPUS', 0, 44, 44, 'w', { rata: 'c', jarak: 1.12 })]
}
