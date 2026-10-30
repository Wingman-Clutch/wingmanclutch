// Form kontak: dicek dulu di browser, dikirim ke /api/kontak, dan kalau backend tidak bisa
// dihubungi, pesannya disiapkan untuk dikirim lewat email.

import { kirimKontak } from '../api/klien'
import { kalimatGalat, periksaKontak, type GalatKolom, type PesanKontak } from '../api/kontrak'
import { STUDIO } from '../data/proyek'

const $ = <T extends HTMLElement>(s: string) => document.querySelector(s) as T

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
  setTimeout(() => (tombol.textContent = label), 1800)
}

export function pasangKontak() {
  const form = $<HTMLFormElement>('#form-kontak')
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
    if (galat.length) return
    const tombol = form.querySelector<HTMLButtonElement>('[type="submit"]')!
    tombol.disabled = true
    tombol.textContent = 'mengirim…'
    cadangan.hidden = true
    const hasil = await kirimKontak(data)
    tombol.disabled = false
    tombol.textContent = 'kirim →'
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
  $('#dlg-kontak').addEventListener('close', () => {
    if (!terkirim.hidden) {
      terkirim.hidden = true
      form.hidden = false
    }
  })
}
