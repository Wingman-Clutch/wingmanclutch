// Helper jawaban JSON. Bentuk galat mengikuti skema Galat di docs/api/openapi.yaml.

export type KodeGalat = 'INPUT_TIDAK_VALID' | 'TERLALU_SERING' | 'LAYANAN_GAGAL'

export interface GalatKolom {
  kolom: 'nama' | 'email' | 'pesan'
  alasan: 'wajib' | 'terlalu_pendek' | 'terlalu_panjang' | 'format'
}

export interface Galat {
  galat: KodeGalat
  pesan: string
  kolom?: GalatKolom[]
  cobaLagiDetik?: number
}

export function json(status: number, isi: unknown, header: Record<string, string> = {}) {
  return new Response(isi === undefined ? null : JSON.stringify(isi), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...header },
  })
}

export const galat = (status: number, isi: Galat, header: Record<string, string> = {}) =>
  json(status, isi, header)
