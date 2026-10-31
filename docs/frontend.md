# Panduan Frontend

Untuk Kall dan agent yang membantu Kall. Baca [AGENTS.md](../AGENTS.md) dan [PRD](prd/PRD-WingmanClutch.md) dulu.

## Menjalankan

```sh
pnpm install          # sekalian mengaktifkan hook git
pnpm dev              # http://localhost:5180, /api dijawab mock
```

Mock API (`apps/web/mock/api.ts`) menjawab `/api/kontak` dan `/api/proyek` sesuai kontrak. Pesan yang memuat `#gagal` dijawab 503 dan `#sering` dijawab 429, untuk mencoba tampilan galat. Kalau Bintang sudah punya backend lokal, jalankan `npx vercel@latest dev` di root, lalu `API_PROXY=http://localhost:3000 pnpm dev` supaya `/api` diteruskan ke sana.

Untuk mencoba dari HP di jaringan yang sama: `pnpm dev --host`.

## Cara kerja halaman

```text
main.ts            merakit semuanya: tema, ukuran layar, papan, baki, lipatan, dialog
halaman/
  tata-letak.ts    posisi setiap sketsa (satuan adegan) untuk potret dan lanskap
  kertas.ts        kertas kotak, kolom TANGGAL, noda kopi, butiran kertas
  papan.ts         semua sketsa di halaman, urutan menggambar, kepakan logo
  lampu.ts         lampu gantung dan tali tariknya (fisika Verlet), saklar tema
  pembuka.ts       layar pembuka: lambang mengepak lalu meluncur ke tempatnya di halaman
  baki.ts          lima pensil (corat-coret) dan penghapus (gosok seluruh halaman)
  lipatan.ts       sudut halaman yang bisa dikupas ke Matrix
  hujan.ts         hujan karakter Matrix
  dialog.ts        lembar detail aplikasi (figur interaktif di iframe), tentang, tim, kontak
  lanyard.ts       kartu nama tim yang tergantung di lanyard (dimuat saat dialog tim dibuka)
  merek.ts         logo Wingman Clutch berisi (bukan sketsa) untuk kartu nama dan tali lanyard
  kontak.ts        form kontak dan cadangan email
  foto-sketsa.ts   foto tim jadi sketsa pensil
engine/
  jalur.ts         path SVG jadi polyline, bentuk dasar, matriks
  goresan.ts       Op (gores, arsir, grup) dikompilasi jadi goresan bergoyang
  huruf.ts         tulisan tangan satu goresan dan judul tebal berarsir
  kuas.ts          warna pensil per tema dan kuas bertekstur butiran
  sketsa.ts        satu sketsa di kanvasnya sendiri, digambar bertahap, dan figur di bawah goresannya
  animasi.ts       satu requestAnimationFrame untuk semua yang bergerak
  tali.ts          fisika tali (lanyard dan tali lampu): simpul Verlet, sambungan, putaran kartu
sketsa/            logo, catatan kecil, dan letak figur
data/              isi halaman (proyek.ts), font.json, logo.json, dan figur.json hasil skrip
../figur/          sumber figur, penyesuaian lembar detail, dan engine Colorfigures
../public/figur/   hasil skrip: halaman figur interaktif dan gambar diam
```

### Satuan

- **Satuan gambar.** Setiap aplikasi menempati kotak 200 x 200 (figurnya di `KOTAK_APLIKASI`), dengan label nama di garis dasar y = 236. Logo memakai koordinat logo brand (872 lebar).
- **Satuan adegan.** Seluruh halaman: lanskap 1700 x 1112, potret 1000 x 2273. Garis kotak buku berjarak 46 satuan. `baris: n` di tata letak menaruh garis dasar tulisan sketsa tepat di garis buku ke-n.
- **Tiga pita.** Header di atas berisi stiker Tentang kami, kolom tanggal, dan lampu gantung. Kaki halaman ada di bawah. Sisanya (logo, empat aplikasi, kontak, tim, catatan, pensil, penghapus) berada di tengah, dengan jarak ke header dan ke kaki halaman yang kurang lebih sama. Adegan lebih tinggi dari referensi (1000 dan 2180) supaya ketiga pita itu terpisah jelas. Kalau isi tengah digeser, `garis0` ikut digeser kelipatan 46 supaya garis tanggal tetap di garis buku, dan posisi `y` mutlak ditambah selisih yang sama.
- **Piksel.** Adegan diskalakan supaya muat di layar (`k` piksel per satuan adegan), lalu setiap sketsa diskalakan lagi dengan `s`.

### Menggambar sketsa

Sketsa adalah fungsi yang mengembalikan daftar `Op`:

```ts
G(d, warna, lebar, opsi) // goresan pensil mengikuti path d
A(d, warna, opsi) // arsiran di dalam bentuk d (opsi.kurang = lubang)
grup(ops, matriks) // geser, putar, skala
tulis(teks, x, y, ukuran) // tulisan tangan (ukuran = tinggi huruf kapital)
judul(teks, x, y, ukuran) // judul tebal berarsir dengan bayangan warna
```

Warna memakai kode pensil: `w` grafit, `k` hitam, `e` warna kertas, `y` kuning, `p` pink, `b` biru, `g` hijau, `o` oranye, `r` merah, `n` cokelat. Warnanya berubah sendiri mengikuti tema (`engine/kuas.ts`), jadi sketsa tidak pernah menulis kode warna CSS.

Goyangan tangan memakai benih dari id sketsa, jadi gambarnya sama setiap kali digambar ulang. Kalau mengubah satu bagian sketsa, bagian lain bisa ikut bergeser sedikit karena urutan angka acaknya berubah; itu wajar.

### Figur

Semua benda di halaman digambar dengan [Colorfigures](https://april-zhu.com/colorfigures): empat aplikasi, Tim kami, lambang Wingman Clutch, lampu gantung, dan mug kopi. Setiap figur adalah model 3D isometrik yang ditulis sebagai satu HTML di `apps/web/figur/`. Namanya tetap ditulis mesin pensil, jadi sketsa aplikasi berisi label dan bingkai tak terlihat, sedangkan gambarnya tinggal di kanvas figur.

| Tempat        | Bentuk                                                                                                                                                                                                                                                                                                                                                               |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Halaman utama | Gambar diam `public/figur/<id>.webp`, dilukis `Sketsa` ke kanvasnya sendiri lewat coretan krayon (`jalurKrayon`). Karena kanvas, penghapus dan noda bekasnya bekerja seperti pada goresan. Ukurannya dibaca dari `src/data/figur.json`, jadi tata letak tidak menunggu gambarnya dimuat                                                                              |
| Lembar detail | Halaman interaktif `public/figur/<id>.html` di iframe. Engine mengambil alih `<body>` dan memakai nama global pendek, jadi harus hidup di dokumennya sendiri. Iframe dibuat baru setiap lembar dibuka dan dibuang saat ditutup, supaya riwayat browser bersih dan figur tidak jalan di belakang. Tim tidak punya halaman interaktif; lembarnya kartu nama berlanyard |

Figur berpose dibuat sebingkai oleh skrip, jadi gambarnya bisa ditukar tanpa bergeser (test membaca ukuran dari kepala berkas WebP):

- **Lambang** (`logo.webp`, `logo-naik.webp`, `logo-turun.webp`): garis tepinya diambil dari `docs/brand/wingman-clutch-emblem.svg`. Sayap mengepak dengan memutar titik-titik ujung sayap di sekitar bahu, jadi siluet pose diamnya sama persis dengan lambang brand. Di halaman, sketsa `logo` hanya berisi lambang (sekaligus tombol kepak), sedangkan WINGMAN, CLUTCH, dan tagline ada di sketsa `merek`.
- **Lampu** (`lampu-nyala.webp`, `lampu-mati.webp`): figur menyimpan dua titik sambungan lewat `window.titikSambung`, yaitu ujung atas kabel dan cincin tali, dan skrip menulisnya ke `figur.json` sebagai pecahan lebar dan tinggi gambar. `halaman/lampu.ts` menyambung kabel CSS sampai tepi atas layar dan menggantung tali tarik SVG dari titik itu. Saklarnya berbunyi saat tali tertarik melewati ambang (`saklar()`), lalu siap lagi setelah talinya kembali masuk. Klik yang menyusul seretan hanya dibuang kalau saklar sudah berbunyi selama seretan itu atau mouse-nya bergeser, jadi ketukan jari yang sedikit bergeser tetap mengganti tema. Seretan jari diuji di E2E Android lewat sentuhan CDP, karena Playwright belum bisa menyeret dengan jari di WebKit. Tarikan jari di iPhone sungguhan sudah dicoba Bintang (31 Oktober 2026).

Layar pembuka (`halaman/pembuka.ts`) diputuskan skrip di `<head>`: kelas `pembuka` dipasang kalau sesi ini belum pernah melihatnya dan pengguna tidak memilih gerak dikurangi, jadi lapisannya sudah tampil di lukisan pertama. Lambang muncul, mengepak dua kali, lalu meluncur ke kotak lambang di halaman. Setelah itu `papan.pembukaan({ logoSiap: true })` menggambar lambang utuh tanpa krayon, dan lapisan pembuka dibuang sesudah satu frame supaya tidak berkedip.

Halaman figur punya CSP sendiri (`default-src 'none'`), tidak diindeks, dan menerima tema lewat `?tema=`. `vercel.json` memasang `X-Frame-Options: SAMEORIGIN` hanya untuk `/figur/`; path lain tetap `DENY`. Kalau iframe gagal dimuat, gambar diamnya tetap tampil.

Mengubah figur:

1. Ubah `figur/<id>.html`. Aturan menggambarnya ada di [`figur/colorfigures/SKILL.md`](../apps/web/figur/colorfigures/SKILL.md): setiap bagian lewat `byDepth`, cek dari semua sudut (`?free=1&yaw=170&pitch=62`), nama global `core.js` jangan dipakai ulang.
2. Jalankan `pnpm --filter @wingmanclutch/web figur`, lalu commit `public/figur/` dan `src/data/figur.json`. Build produksi tidak menjalankan skrip ini.
3. Keadaan figur di gambar diam diatur di daftar `FIGUR` pada `scripts/buat-figur.mjs`.

Tampilan di dalam lembar detail (warna tema, huruf, tombol, teks Bahasa Indonesia) diatur `figur/sematan.css` dan `figur/sematan.js`, yang disisipkan paling akhir. Engine di `figur/colorfigures/` adalah salinan utuh dari [arsip Colorfigures](https://april-zhu.com/colorfigures/colorfigures.tar.gz) per 30 Oktober 2026, dibiarkan apa adanya supaya gampang diperbarui.

### Menambah atau mengubah aplikasi

1. Teks, tautan, tumpukan teknologi, dan keterangan fitur: `src/data/proyek.ts`.
2. Figur: satu file di `figur/`, didaftarkan di `FIGUR` pada `scripts/buat-figur.mjs` (lihat bagian Figur).
3. Posisi: `src/halaman/tata-letak.ts` untuk potret dan lanskap.
4. Jalankan `pnpm test`. Test tata letak gagal kalau ada sketsa yang keluar halaman atau menindih logo, aplikasi lain, kontak, atau tim. Test yang sama juga gagal kalau kepakan logo menimpa kolom tanggal atau lampu, kalau lampu dan talinya (sampai ditarik penuh) menimpa sketsa, atau kalau sudut yang terlipat menutupi kolom tanggal dan lampu.
5. Kalau id aplikasi baru, ubah juga enum `id` di `docs/api/openapi.yaml` dan mock-nya (bilang Bintang di PR).

### Skrip

| Perintah                                 | Kapan                                                             |
| ---------------------------------------- | ----------------------------------------------------------------- |
| `pnpm --filter @wingmanclutch/web font`  | Daftar karakter atau sumber font berubah                          |
| `pnpm --filter @wingmanclutch/web figur` | Figur, `sematan.css`, atau `sematan.js` berubah (butuh `python3`) |
| `node apps/web/scripts/buat-logo.mjs`    | Logo brand di `docs/brand/` berubah                               |
| `node apps/web/scripts/buat-gambar.mjs`  | Tampilan berubah dan gambar README atau OG perlu diperbarui       |

### Diagram arsitektur

Diagram dibuat dengan [Archify](https://github.com/tt-a1i/archify) dari [`arsitektur.archify.json`](arsitektur.archify.json). Versi interaktifnya (`docs/arsitektur.html`) dipublikasikan GitHub Pages dari folder `docs/` (ada `docs/.nojekyll`) di <https://wingman-clutch.github.io/wingmanclutch/arsitektur.html>, dan setiap bagian menaut ke baris kode di commit `meta.repository.revision`. Setelah arsitektur berubah (misalnya `api/` sudah dibuat Bintang):

1. Perbarui komponen, sumber baris, dan `meta.repository.revision` ke commit yang sudah di-push.
2. Jalankan `node <archify>/bin/archify.mjs finalize architecture docs/arsitektur.archify.json .archify/arsitektur.html --repo-root . --quality showcase` (folder `.archify/` di-ignore).
3. Salin `.archify/arsitektur.html` ke `docs/arsitektur.html`.
4. Ekspor PNG terang dan gelap lewat tombol Ekspor (Gambar tanpa kompresi), lalu simpan sebagai WebP 2400 px: `cwebp -q 92 -resize 2400 0 <png> -o docs/gambar/arsitektur-terang.webp`, begitu juga `arsitektur-gelap.webp`.

## Test

| Perintah        | Isi                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test`     | Parser path, arsiran, tulisan, lipatan sudut, tata letak (semua sketsa di dalam halaman dan tidak saling tindih, kolom tanggal tidak tertimpa kepakan logo atau sudut terlipat), kontrak (mock divalidasi dengan skema `openapi.yaml`), skrip tata letak di `<head>` sama dengan `hitungUkuran`, `cicil`, fisika tali lanyard, susunan logo di kartu nama, hasil skrip figur (ukuran gambar, lisensi, CSP, muatan luar), letak figur, coretan krayon, header `vercel.json`                                                                                                         |
| `pnpm test:e2e` | Build produksi dengan mock API di Chrome desktop, Pixel 7, dan iPhone 15 (WebKit): semua sketsa dan figur tergambar, tanpa scroll, lembar setiap aplikasi, figur interaktif (tombol, seret, Escape dari dalam iframe, tema, gagal dimuat, riwayat browser), tentang ke tim ke kontak, kartu nama tim (dibalik dengan Enter atau ketukan, diseret tanpa terbalik), form kontak (galat, terkirim, cadangan email), tema tersimpan, Matrix, kepakan logo, keyboard, corat-coret dan penghapus, gerak dikurangi, axe 0 pelanggaran di halaman (terang, gelap, Matrix) dan semua dialog |

Sketsa yang sedang bergerak diam (melayang, mengayun) membuat Playwright menganggapnya "tidak stabil", jadi E2E mengetuknya dengan `click({ force: true })`.

## Deploy

Vercel men-deploy `main` dari root repo memakai `vercel.json`: build `pnpm build`, hasil `apps/web/dist`, dan Functions dari `api/`. Proyeknya `wingmanclutch` di akun Kall (`haikalfaruqs-projects`), terhubung ke repo GitHub ini, dan tampil di <https://wingmanclutch.vercel.app>. Frontend tidak butuh env apa pun.

Kalau perlu memakai Vercel CLI, jalankan `vercel link` di folder sementara, karena perintah itu menulis `.env.local` berisi token. Kalau `/api/proyek` gagal, lembar detail menyembunyikan statistik; kalau `/api/kontak` gagal, form kontak menawarkan email.

Lighthouse mobile 30 Oktober 2026 (Lighthouse 13.6, build produksi lokal, CPU diperlambat 9x supaya setara mesin PageSpeed Insights): sebelum PR `feat/lighthouse-axe` Performa 88–97 (TBT 200–450 ms, CLS 0,044), sesudahnya Performa 99–100 (TBT 60–110 ms, CLS 0). Aksesibilitas dan Best Practices 100, SEO produksi 100 (di `vite preview` lokal 92 karena `/robots.txt` dijawab `index.html`). Yang dulu menahan Performa: semua sketsa dikompilasi di satu tugas pembuka, hujan Matrix digambar penuh walau belum terlihat, dan ubin butiran. Sekarang `Sketsa` baru dikompilasi saat dibutuhkan dan `Papan` mencicilnya per tugas (`cicil` di `engine/animasi.ts`), hujan hanya digambar di bagian yang terlihat, dan butiran dibuat saat browser senggang. Skrip di `<head>` menghitung tata letak sebelum dicat supaya kaki halaman tidak melompat; kalau skrip itu diubah, hash di CSP ikut diganti (`test/csp.test.ts` memberi hash barunya). Setelah figur masuk (dengan cara ukur yang sama): Performa 99, TBT 100–120 ms, CLS 0, total muatan halaman 365 KiB, termasuk lima gambar figur sekitar 50 KB per gambar. Halaman figur baru dimuat saat lembarnya dibuka. Setelah semua benda jadi figur dan ada layar pembuka (31 Oktober 2026, cara ukur sama, lima kali): Performa 98–99, TBT 40–150 ms, LCP 1,6–1,8 detik, CLS 0, total muatan 503 KiB. Tambahannya sekitar 134 KB gambar: lambang tiga pose, lampu dua keadaan, dan mug. Layar pembuka hanya menukar gambar dan memakai animasi CSS, jadi tidak menambah tugas panjang. Satu run pertama sempat dapat Performa 69, tapi tugas panjangnya milik skrip Lighthouse sendiri (`_lighthouse-eval.js`), bukan halaman.

## Checklist

### Rilis 1

- [x] Mesin pensil: path SVG, goyangan tangan, arsiran, kuas butiran, tulisan tangan dan judul
- [x] Kertas, tanggal, noda kopi, tema terang dan gelap tersimpan
- [x] Logo: lambang figur Colorfigures yang mengepak saat diketuk, tulisan WINGMAN CLUTCH dari pensil
- [x] Figur Colorfigures untuk semua benda: empat aplikasi (interaktif di lembar detail), tim, lambang, lampu, kopi
- [x] Layar pembuka: lambang mengepak lalu mendarat, sekali per sesi, bisa dilewati
- [x] Tema lewat tali lampu gantung: tarik, klik, atau Enter
- [x] Catatan: tentang kami, tim kami, kontak, rumus FE + BE, kopi, petunjuk, kilau
- [x] Tata letak potret dan lanskap, muat tanpa scroll dari 320 px
- [x] Lima pensil untuk corat-coret dan penghapus yang menggambar ulang halaman
- [x] Sudut halaman dikupas ke Matrix dan kembali
- [x] Dialog detail aplikasi, tentang, tim (foto jadi sketsa pensil), kontak
- [x] Form kontak dengan validasi, mock API, dan cadangan email
- [x] Unit test dan E2E di tiga perangkat
- [x] Gambar README, gambar OG, dan diagram arsitektur Archify
- [x] Deploy halaman ke Vercel (`wingmanclutch.vercel.app`), terhubung ke repo
- [x] Lighthouse mobile ≥ 95 di keempat kategori (baseline di bagian Deploy), axe 0 pelanggaran di halaman dan semua dialog
- [x] Cek alur kontak dan statistik di produksi bersama Bintang, setelah `api/` jadi
- [ ] Ganti mock dengan backend sungguhan di E2E produksi (smoke test), setelah `api/` jadi
