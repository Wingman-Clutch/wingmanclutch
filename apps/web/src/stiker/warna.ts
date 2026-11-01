// Warna stiker mengikuti pensil halaman. Pink karet sama dengan penghapus di baki.

import { PENSIL } from '../engine/kuas'
import type { Palette } from './fun'

export const PALET: Partial<Palette> = {
  main: '#f29fb0',
  tint: '#f9c6cd',
  gold: PENSIL.y,
  ok: PENSIL.g,
  hot: PENSIL.r,
  deep: PENSIL.b,
}
