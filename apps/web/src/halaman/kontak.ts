// Form kontak: dicek dulu di browser, dikirim ke /api/kontak, dan kalau backend tidak bisa
// dihubungi, pesannya disiapkan untuk dikirim lewat email.

import type { CueName } from 'uisfx'
import { kirimKontak, type HasilKontak } from '../api/klien'
import { kalimatGalat, periksaKontak, type GalatKolom, type PesanKontak } from '../api/kontrak'
import { STUDIO } from '../data/proyek'
import { BUNYI, suara, TUNDA_LOOP } from './suara'

const $ = <T extends HTMLElement>(s: string) => document.querySelector(s) as T

/** bunyi setiap hasil kiriman, dimainkan setelah jawabannya sampai */
export const BUNYI_HASIL = {
  terkirim: BUNYI.terkirim,
  tidak_valid: BUNYI.isianSalah,
  terlalu_sering: BUNYI.kebanyakanKirim,
  gagal: BUNYI.gagalKirim,
} as const satisfies Record<HasilKontak['jenis'], CueName>

async function salin(
  teks: string,
  tombol: HTMLButtonElement,
  cadangan: HTMLElement | null,
  label: string,
) {
  let berhasil = false
  try {
    await navigator.clipboard.writeText(teks)
    berhasil = true
  } catch {
    // clipboard ditolak: pilih teksnya supaya bisa disalin manual
    if (cadangan) {
      const r = document.createRange()
      r.selectNodeContents(cadangan)
      const sel = getSelection()
      sel?.removeAllRanges()
      sel?.addRange(r)
    }
  }
  tombol.textContent = berhasil ? 'tersalin!' : 'sudah dipilih, salin manual'
  suara.mainkan(berhasil ? BUNYI.tersalin : BUNYI.salinManual)
  setTimeout(() => (tombol.textContent = label), 1800)
}

export function pasangKontak() {
  const form = $<HTMLFormElement>('#form-kontak')
  const dialog = $<HTMLDialogElement>('#dlg-kontak')
  const galatEl = $('#kt-galat')
  const terkirim = $('#kt-terkirim')
  const cadangan = $('#kt-cadangan')
  const mailto = $<HTMLAnchorElement>('#kt-mailto')
  let catatan = ''

  const tandai = (galat: GalatKolom[]) => {
    for (const el of form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
      'input, textarea',
    )) {
      el.removeAttribute('aria-invalid')
    }
    for (const g of galat)
      (form.elements.namedItem(g.kolom) as HTMLInputElement | null)?.setAttribute(
        'aria-invalid',
        'true',
      )
    galatEl.hidden = galat.length === 0
    galatEl.textContent = galat.map(kalimatGalat).join(' ')
    if (galat.length) (form.elements.namedItem(galat[0].kolom) as HTMLInputElement).focus()
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const f = new FormData(form)
    const data: PesanKontak = {
      nama: String(f.get('nama') ?? '').trim(),
      email: String(f.get('email') ?? '').trim(),
      pesan: String(f.get('pesan') ?? '').trim(),
      situs: String(f.get('situs') ?? ''),
    }
    const galat = periksaKontak(data)
    tandai(galat)
    if (galat.length) return void suara.mainkan(BUNYI.isianSalah)
    const tombol = form.querySelector<HTMLButtonElement>('[type="submit"]')!
    tombol.disabled = true
    tombol.textContent = 'mengirim…'
    cadangan.hidden = true
    // loop baru berbunyi kalau kirimnya lama, dan berhenti begitu ada jawaban atau dialog ditutup
    const hasil = await suara.proses('kirim', BUNYI.mengirim, () => kirimKontak(data), TUNDA_LOOP)
    tombol.disabled = false
    tombol.textContent = 'kirim →'
    // dialog sudah ditutup: tidak ada yang terlihat berubah, jadi tidak berbunyi juga
    if (dialog.open) suara.mainkan(BUNYI_HASIL[hasil.jenis])
    if (hasil.jenis === 'terkirim') {
      form.reset()
      form.hidden = true
      terkirim.hidden = false
      return
    }
    if (hasil.jenis === 'tidak_valid') return tandai(hasil.galat.kolom ?? [])
    if (hasil.jenis === 'terlalu_sering') {
      galatEl.hidden = false
      galatEl.textContent = `Kebanyakan kirim dari jaringan ini. Coba lagi ${Math.ceil(hasil.cobaLagiDetik / 60)} menit lagi, atau email langsung ya.`
      return
    }
    // backend belum bisa dihubungi: siapkan email dengan isi yang sama
    catatan = `${data.pesan}\n\n${data.nama} (${data.email})`
    mailto.href = `mailto:${STUDIO.email}?subject=${encodeURIComponent(`Ide dari ${data.nama}`)}&body=${encodeURIComponent(catatan)}`
    cadangan.hidden = false
  })

  $<HTMLButtonElement>('#kt-salin-pesan').addEventListener('click', (e) =>
    salin(catatan, e.currentTarget as HTMLButtonElement, null, 'salin pesan'),
  )
  $<HTMLButtonElement>('#kt-salin-email').addEventListener('click', (e) =>
    salin(STUDIO.email, e.currentTarget as HTMLButtonElement, $('#kt-email'), 'salin'),
  )

  // dialog dibuka lagi setelah terkirim: tampilkan form kosong
  dialog.addEventListener('close', () => {
    suara.hentikanLoop('kirim')
    if (!terkirim.hidden) {
      terkirim.hidden = true
      form.hidden = false
    }
  })
}
