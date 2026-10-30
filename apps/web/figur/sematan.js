// Penyesuaian terakhir halaman figur: teks bawaan engine jadi Bahasa Indonesia. Disisipkan
// buat-figur.mjs paling akhir, setelah engine dan fitur build.py selesai jalan.
;(() => {
  const teks = { xrb: 'Tembus pandang', lblb: 'Label' }
  for (const [id, isi] of Object.entries(teks)) {
    const el = document.getElementById(id)
    if (el) el.textContent = isi
  }
  const label = { '.zm': 'Perkecil', '.zi': 'Perbesar' }
  for (const [pilih, isi] of Object.entries(label))
    document.querySelector(pilih)?.setAttribute('aria-label', isi)
  // nama tombol ini angka yang terlihat (100%), jadi keterangannya lewat title
  const ukuran = document.querySelector('.zp')
  ukuran?.removeAttribute('aria-label')
  ukuran?.setAttribute('title', 'Kembalikan ukuran')
})()
