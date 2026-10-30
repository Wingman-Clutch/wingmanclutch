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
  papan.ts         semua sketsa di halaman, urutan menggambar, layar yang berganti, kepakan logo
  baki.ts          lima pensil (corat-coret) dan penghapus (gosok seluruh halaman)
  lipatan.ts       sudut halaman yang bisa dikupas ke Matrix
  hujan.ts         hujan karakter Matrix
  dialog.ts        lembar detail aplikasi, tentang, tim, kontak
  kontak.ts        form kontak dan cadangan email
  foto-sketsa.ts   foto tim jadi sketsa pensil
engine/
  jalur.ts         path SVG jadi polyline, bentuk dasar, matriks
  goresan.ts       Op (gores, arsir, grup) dikompilasi jadi goresan bergoyang
  huruf.ts         tulisan tangan satu goresan dan judul tebal berarsir
  kuas.ts          warna pensil per tema dan kuas bertekstur butiran
  sketsa.ts        satu sketsa di kanvasnya sendiri, digambar bertahap
  animasi.ts       satu requestAnimationFrame untuk semua yang bergerak
sketsa/            gambar setiap aplikasi, logo, dan catatan kecil
data/              isi halaman (proyek.ts), font.json dan logo.json hasil skrip
```

### Satuan

- **Satuan gambar.** Setiap sketsa perangkat dirancang di kotak 200 x 200, dengan label nama di garis dasar y = 236. Logo memakai koordinat logo brand (872 lebar).
- **Satuan adegan.** Seluruh halaman: lanskap 1700 x 1112, potret 1000 x 2273. Garis kotak buku berjarak 46 satuan. `baris: n` di tata letak menaruh garis dasar tulisan sketsa tepat di garis buku ke-n.
- **Tiga pita.** Header di atas berisi stiker Tentang kami, kolom tanggal, dan saklar tema. Kaki halaman ada di bawah. Sisanya (logo, empat aplikasi, kontak, tim, catatan, pensil, penghapus) berada di tengah, dengan jarak ke header dan ke kaki halaman yang kurang lebih sama. Adegan lebih tinggi dari referensi (1000 dan 2180) supaya ketiga pita itu terpisah jelas. Kalau isi tengah digeser, `garis0` ikut digeser kelipatan 46 supaya garis tanggal tetap di garis buku, dan posisi `y` mutlak ditambah selisih yang sama.
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

### Menambah atau mengubah aplikasi

1. Teks, tautan, tumpukan teknologi, dan keterangan fitur: `src/data/proyek.ts`.
2. Gambar perangkat dan layarnya: satu file di `src/sketsa/`. Setiap layar mengisi area layar perangkat dan punya satu keterangan di `fitur`.
3. Posisi: `src/halaman/tata-letak.ts` untuk potret dan lanskap.
4. Jalankan `pnpm test`. Test tata letak gagal kalau ada sketsa yang keluar halaman atau menindih logo, aplikasi lain, kontak, atau tim. Test yang sama juga gagal kalau kepakan logo menimpa kolom tanggal atau saklar tema, atau kalau sudut yang terlipat menutupi keduanya.
5. Kalau id aplikasi baru, ubah juga enum `id` di `docs/api/openapi.yaml` dan mock-nya (bilang Bintang di PR).

### Skrip

| Perintah                                | Kapan                                                       |
| --------------------------------------- | ----------------------------------------------------------- |
| `pnpm --filter @wingmanclutch/web font` | Daftar karakter atau sumber font berubah                    |
| `node apps/web/scripts/buat-logo.mjs`   | Logo brand di `docs/brand/` berubah                         |
| `node apps/web/scripts/buat-gambar.mjs` | Tampilan berubah dan gambar README atau OG perlu diperbarui |

### Diagram arsitektur

Diagram dibuat dengan [Archify](https://github.com/tt-a1i/archify) dari [`arsitektur.archify.json`](arsitektur.archify.json). Versi interaktifnya (`docs/arsitektur.html`) dipublikasikan GitHub Pages dari folder `docs/` (ada `docs/.nojekyll`) di <https://wingman-clutch.github.io/wingmanclutch/arsitektur.html>, dan setiap bagian menaut ke baris kode di commit `meta.repository.revision`. Setelah arsitektur berubah (misalnya `api/` sudah dibuat Bintang):

1. Perbarui komponen, sumber baris, dan `meta.repository.revision` ke commit yang sudah di-push.
2. Jalankan `node <archify>/bin/archify.mjs finalize architecture docs/arsitektur.archify.json .archify/arsitektur.html --repo-root . --quality showcase` (folder `.archify/` di-ignore).
3. Salin `.archify/arsitektur.html` ke `docs/arsitektur.html`.
4. Ekspor PNG terang dan gelap lewat tombol Ekspor (Gambar tanpa kompresi), lalu simpan sebagai WebP 2400 px: `cwebp -q 92 -resize 2400 0 <png> -o docs/gambar/arsitektur-terang.webp`, begitu juga `arsitektur-gelap.webp`.

## Test

| Perintah        | Isi                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test`     | Parser path, arsiran, tulisan, lipatan sudut, tata letak (semua sketsa di dalam halaman dan tidak saling tindih, kolom tanggal tidak tertimpa kepakan logo atau sudut terlipat), kontrak (mock divalidasi dengan skema `openapi.yaml`), skrip tata letak di `<head>` sama dengan `hitungUkuran`, `cicil`                                                                                    |
| `pnpm test:e2e` | Build produksi dengan mock API di Chrome desktop, Pixel 7, dan iPhone 15 (WebKit): semua sketsa tergambar, tanpa scroll, lembar setiap aplikasi, tentang ke tim ke kontak, form kontak (galat, terkirim, cadangan email), tema tersimpan, Matrix, kepakan logo, keyboard, corat-coret dan penghapus, gerak dikurangi, axe 0 pelanggaran di halaman (terang, gelap, Matrix) dan semua dialog |

Sketsa yang sedang bergerak diam (melayang, mengayun) membuat Playwright menganggapnya "tidak stabil", jadi E2E mengetuknya dengan `click({ force: true })`.

## Deploy

Vercel men-deploy `main` dari root repo memakai `vercel.json`: build `pnpm build`, hasil `apps/web/dist`, dan Functions dari `api/`. Proyeknya `wingmanclutch` di akun Kall (`haikalfaruqs-projects`), terhubung ke repo GitHub ini, dan tampil di <https://wingmanclutch.vercel.app>. Frontend tidak butuh env apa pun.

Kalau perlu memakai Vercel CLI, jalankan `vercel link` di folder sementara, karena perintah itu menulis `.env.local` berisi token. Sebelum `api/` ada, `/api/*` di produksi menjawab 404: lembar detail menyembunyikan statistik, dan form kontak langsung menawarkan email.

Lighthouse mobile 30 Oktober 2026 (Lighthouse 13.6, build produksi lokal, CPU diperlambat 9x supaya setara mesin PageSpeed Insights): sebelum PR `feat/lighthouse-axe` Performa 88–97 (TBT 200–450 ms, CLS 0,044), sesudahnya Performa 99–100 (TBT 60–110 ms, CLS 0). Aksesibilitas dan Best Practices 100, SEO produksi 100 (di `vite preview` lokal 92 karena `/robots.txt` dijawab `index.html`). Yang dulu menahan Performa: semua sketsa dikompilasi di satu tugas pembuka, hujan Matrix digambar penuh walau belum terlihat, dan ubin butiran. Sekarang `Sketsa` baru dikompilasi saat dibutuhkan dan `Papan` mencicilnya per tugas (`cicil` di `engine/animasi.ts`), hujan hanya digambar di bagian yang terlihat, dan butiran dibuat saat browser senggang. Skrip di `<head>` menghitung tata letak sebelum dicat supaya kaki halaman tidak melompat; kalau skrip itu diubah, hash di CSP ikut diganti (`test/csp.test.ts` memberi hash barunya).

## Checklist

### Rilis 1

- [x] Mesin pensil: path SVG, goyangan tangan, arsiran, kuas butiran, tulisan tangan dan judul
- [x] Kertas, tanggal, noda kopi, tema terang dan gelap tersimpan
- [x] Logo pensil dari logo brand, kepakan sayap saat diketuk
- [x] Empat perangkat dengan tiga layar yang berganti dan gerak diam
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
- [ ] Cek alur kontak dan statistik di produksi bersama Bintang, setelah `api/` jadi
- [ ] Ganti mock dengan backend sungguhan di E2E produksi (smoke test), setelah `api/` jadi
