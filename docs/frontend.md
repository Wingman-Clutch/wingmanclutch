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
  suara.ts         bunyi antarmuka (uisfx pack zen), tombol suara, loop proses, nada kombo, dan butir gerakan
  suara-figur.ts   bunyi tombol dan putaran di dalam figur interaktif
  foto-sketsa.ts   foto tim jadi sketsa pensil
nyasar.ts          halaman 404: angka pensil yang kegosok dan stiker penghapus
engine/
  jalur.ts         path SVG jadi polyline, bentuk dasar, matriks
  goresan.ts       Op (gores, arsir, grup) dikompilasi jadi goresan bergoyang
  huruf.ts         tulisan tangan satu goresan dan judul tebal berarsir
  kuas.ts          warna pensil per tema dan kuas bertekstur butiran
  sketsa.ts        satu sketsa di kanvasnya sendiri, digambar bertahap, dan figur di bawah goresannya
  animasi.ts       satu requestAnimationFrame untuk semua yang bergerak
  tali.ts          fisika tali (lanyard dan tali lampu): simpul Verlet, sambungan, putaran kartu
sketsa/            logo, catatan kecil, letak figur, dan tulisan halaman 404
stiker/            kit fun-isometric (tidak diubah) dan stiker buatan kita
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

Data font ikut ke bundle JS, jadi `font.json` hanya menyimpan karakter yang ditulis di halaman (`KARAKTER_TANGAN` dan `KARAKTER_JUDUL` di `scripts/buat-font.mjs`). `judul` selalu mengkapitalkan teksnya, dan `tulis` hanya dipakai dengan kapital. Karakter yang tidak punya glyph tergambar sebagai `?`, dan `test/font.test.ts` gagal sambil menyebut karakternya. Tambahkan karakter itu di skrip, lalu jalankan `pnpm --filter @wingmanclutch/web font`.

### Figur

Semua benda di halaman digambar dengan [Colorfigures](https://april-zhu.com/colorfigures): empat aplikasi, Tim kami, lambang Wingman Clutch, lampu gantung, dan mug kopi. Setiap figur adalah model 3D isometrik yang ditulis sebagai satu HTML di `apps/web/figur/`. Namanya tetap ditulis mesin pensil, jadi sketsa aplikasi berisi label dan bingkai tak terlihat, sedangkan gambarnya tinggal di kanvas figur.

| Tempat        | Bentuk                                                                                                                                                                                                                                                                                                                                                               |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Halaman utama | Gambar diam `public/figur/<id>.webp`, dilukis `Sketsa` ke kanvasnya sendiri lewat coretan krayon (`jalurKrayon`). Karena kanvas, penghapus dan noda bekasnya bekerja seperti pada goresan. Ukurannya dibaca dari `src/data/figur.json`, jadi tata letak tidak menunggu gambarnya dimuat                                                                              |
| Lembar detail | Halaman interaktif `public/figur/<id>.html` di iframe. Engine mengambil alih `<body>` dan memakai nama global pendek, jadi harus hidup di dokumennya sendiri. Iframe dibuat baru setiap lembar dibuka dan dibuang saat ditutup, supaya riwayat browser bersih dan figur tidak jalan di belakang. Tim tidak punya halaman interaktif; lembarnya kartu nama berlanyard |

Figur berpose dibuat sebingkai oleh skrip, jadi gambarnya bisa ditukar tanpa bergeser (test membaca ukuran dari kepala berkas WebP):

- **Lambang** (`logo.webp`, `logo-naik.webp`, `logo-turun.webp`): garis tepinya diambil dari `docs/brand/wingman-clutch-emblem.svg`. Sayap mengepak dengan memutar titik-titik ujung sayap di sekitar bahu, jadi siluet pose diamnya sama persis dengan lambang brand. Di halaman, sketsa `logo` hanya berisi lambang (sekaligus tombol kepak), sedangkan WINGMAN, CLUTCH, dan tagline ada di sketsa `merek`.
- **Lampu** (`lampu-nyala.webp`, `lampu-mati.webp`): figur menyimpan dua titik sambungan lewat `window.titikSambung`, yaitu ujung atas kabel dan cincin tali, dan skrip menulisnya ke `figur.json` sebagai pecahan lebar dan tinggi gambar. `halaman/lampu.ts` menyambung kabel CSS sampai tepi atas layar dan menggantung tali tarik SVG dari titik itu. Saklarnya berbunyi saat tali tertarik melewati ambang (`saklar()`), lalu siap lagi setelah talinya kembali masuk. Klik yang menyusul seretan hanya dibuang kalau saklar sudah berbunyi selama seretan itu atau mouse-nya bergeser, jadi ketukan jari yang sedikit bergeser tetap mengganti tema. Seretan jari diuji di E2E Android lewat sentuhan CDP, karena Playwright belum bisa menyeret dengan jari di WebKit. Tarikan jari di iPhone sungguhan sudah dicoba Bintang (31 Oktober 2026).

Layar pembuka (`halaman/pembuka.ts`) diputuskan skrip di `<head>`: kelas `pembuka` dipasang kalau sesi ini belum pernah melihatnya dan pengguna tidak memilih gerak dikurangi, jadi lapisannya sudah tampil di lukisan pertama. Lambang muncul, mengepak dua kali, lalu meluncur ke kotak lambang di halaman. Setelah itu `papan.pembukaan({ logoSiap: true })` menggambar lambang utuh tanpa krayon, dan lapisan pembuka dibuang sesudah satu frame supaya tidak berkedip. Gambar pose sayap baru dimuat saat kepakan pertama, jadi kepakan di layar pembuka dibatasi 1,5 detik: kalau gambarnya tersendat di jaringan jelek, lambang tetap meluncur dan halaman tetap terbuka.

Halaman figur punya CSP sendiri (`default-src 'none'`), tidak diindeks, dan menerima tema lewat `?tema=`. `vercel.json` memasang `X-Frame-Options: SAMEORIGIN` hanya untuk `/figur/`; path lain tetap `DENY`. Kalau iframe gagal dimuat, gambar diamnya tetap tampil.

Mengubah figur:

1. Ubah `figur/<id>.html`. Aturan menggambarnya ada di [`figur/colorfigures/SKILL.md`](../apps/web/figur/colorfigures/SKILL.md): setiap bagian lewat `byDepth`, cek dari semua sudut (`?free=1&yaw=170&pitch=62`), nama global `core.js` jangan dipakai ulang.
2. Jalankan `pnpm --filter @wingmanclutch/web figur`, lalu commit `public/figur/` dan `src/data/figur.json`. Build produksi tidak menjalankan skrip ini.
3. Keadaan figur di gambar diam diatur di daftar `FIGUR` pada `scripts/buat-figur.mjs`.

Tampilan di dalam lembar detail (warna tema, huruf, tombol, teks Bahasa Indonesia) diatur `figur/sematan.css` dan `figur/sematan.js`, yang disisipkan paling akhir. Engine di `figur/colorfigures/` adalah salinan utuh dari [arsip Colorfigures](https://april-zhu.com/colorfigures/colorfigures.tar.gz) per 30 Oktober 2026, dibiarkan apa adanya supaya gampang diperbarui.

### Suara

Bunyi antarmuka berasal dari [uisfx](https://uisfx.com) dengan pack `zen`, yang berisi lipatan kertas, sapuan kuas, kayu kering, dan denting pelan. Dari 12 pack yang ada, `zen` paling gelap (pusat spektrumnya sekitar 570 sampai 1.070 Hz, pack lain 1,4 sampai 4 kHz) dan bunyinya pendek, kebanyakan di bawah 0,4 detik. Jadi cocok dengan buku catatan bergambar pensil, dan tidak bikin capek di halaman yang jarang diketuk. Bunyinya disintesis uisfx di browser, jadi tidak ada berkas audio yang diunduh.

| Kejadian                                                                | Cue                                                                                           |
| ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Lembar dibuka atau ditutup                                              | `open`, `close`                                                                               |
| Pindah lembar lewat tombol di dalamnya                                  | `forward`                                                                                     |
| Mouse menyorot sketsa yang bisa diketuk, pensil, atau penghapus         | `hover`                                                                                       |
| Logo diketuk: nadanya naik setiap ketukan beruntun                      | `drag-start`, ditambah hadiah `streak` (ketukan 4 dan 12), `level-up` (8), `achievement` (16) |
| Layar pembuka dilewati                                                  | `swipe`                                                                                       |
| Tali lampu dipegang, lampu nyala atau padam, tali dilepas               | `drag-start`, `toggle-on` atau `toggle-off`, `release`                                        |
| Sudut diangkat, kembali, atau dikupas ke Matrix, lalu dunianya berganti | `drag-start`, `collapse`, `swipe`, lalu `connect` atau `disconnect`                           |
| Kartu nama dibalik, diangkat, dilepas                                   | `swipe`, `drag-start`, `drop`                                                                 |
| Pensil dipilih (setiap warna punya nada) atau diletakkan                | `select`, `deselect`                                                                          |
| Mencoret, dan halaman digambar ulang setelah pengunjung bergerak        | butir `swipe` yang dipercepat                                                                 |
| Penghapus menggosok halaman (loop, ditambah satu gosokan per baris)     | `processing`, `swipe`                                                                         |
| Halaman bersih, lalu utuh lagi setelah digambar ulang                   | `delete`, `complete`                                                                          |
| Tombol langkah di figur (per aplikasi, `BUNYI_LANGKAH`)                 | misalnya `badge` untuk Tarik kartu, `unlock` untuk Buka pintu                                 |
| Ukuran figur, pilihan di figur, tombol figur lainnya                    | `expand`, `collapse`, `back`, `toggle-on` atau `toggle-off`, `press`                          |
| Figur diputar (satu detak per jarak tertentu), lalu dilepas             | `typing`, `release`                                                                           |
| Form kontak: isian salah, terkirim, kebanyakan kirim, gagal             | `error`, `send`, `blocked`, `error`                                                           |
| Form kontak masih mengirim setelah 0,7 detik (loop)                     | `loading`                                                                                     |
| Salin berhasil, atau teks dipilih supaya disalin manual                 | `copy`, `info`                                                                                |
| Suara dinyalakan lewat tombol suara                                     | `toggle-on`                                                                                   |

- **Satu pintu.** Semua bunyi lewat `BUNYI` dan `suara` di `halaman/suara.ts`, jangan panggil uisfx langsung. Bunyi dimainkan saat keadaan yang terlihat berubah (`gantiKertas`, `Dialog.buka`, event `close`), bukan di event pointer atau keyboard. Jadi klik, ketukan, Enter, dan Spasi sama-sama berbunyi sekali. Seretan dan goresan memang hanya ada di pointer, jadi bunyinya di event pointer, dan baru berbunyi setelah gerakannya lewat ambang geser supaya ketukan biasa tetap satu bunyi.
- **Tidak pernah berbunyi duluan.** Konteks audio dibuat dan dibangunkan di `pointerdown`, `pointerup`, `keydown`, atau `click` pertama. Modul uisfx (chunk terpisah, sekitar 12 KB gzip) dimuat saat browser senggang. Selama konteksnya masih tertahan, bunyi hanya boleh di dalam aktivasi pengguna, supaya tidak tertunda lalu berbunyi belakangan.
- **Loop selalu berhenti.** Setiap loop punya kunci (`hapus`, `kirim`) dan berhenti di semua jalan keluar. `proses()` menghentikannya di `finally`, menutup dialog kontak memanggil `hentikanLoop('kirim')`, dan halaman yang disembunyikan atau suara yang dimatikan menghentikan semua loop. Bunyi hasil dimainkan setelah loopnya berhenti, dan hanya kalau dialognya masih terbuka.
- **Tombol suara** ada di kaki halaman (`#suara` dengan `aria-pressed`). Pilihannya disimpan di localStorage sebagai `wc-suara` (`{"nyala":false,"volume":0.7}`), dan skrip di `<head>` membacanya supaya tulisan "suara: mati" sudah benar di lukisan pertama. Di HP hurufnya ikut mengecil bersama halaman, jadi bidang ketuknya diperluas dengan `::after`. `prefers-reduced-motion` tidak mematikan suara.
- **Ketukan beruntun.** `Kombo` menghitung ketukan logo, dan mulai lagi setelah jeda 0,9 detik atau setelah 16 ketukan. `nada()` memberi laju putar di tangga nada pentatonik, jadi bunyinya naik tanpa pernah sumbang, dan uisfx tidak perlu menyintesis bunyi baru. Ketukan yang dapat hadiah juga mengepak dua kali, supaya hadiahnya ikut terlihat. Bunyi yang bisa datang rapat memakai `BERTUMPUK`, karena bawaan uisfx memotong bunyi yang sama yang masih berjalan.
- **Gerakan menerus.** `Butiran` memberi satu butir bunyi setiap jarak tertentu, paling rapat beberapa puluh milidetik, jadi coretan cepat terdengar lebih rapat dari coretan pelan. Goresan pensil (`suara.gores()`) memakai `swipe` yang dipercepat sekitar dua kali, karena jadi desis terang di sekitar 2 kHz, sedangkan `typing` malah jadi bernada kalau dipercepat. Volumenya ditentukan dari sinyal keluaran yang diukur di Chromium: bunyi utama puncaknya sekitar −29 dBFS, sorotan −38, goresan −41, dan yang paling ramai (16 ketukan logo dengan semua hadiah) −21,5, jadi tidak pecah.
- **Figur interaktif.** `halaman/suara-figur.ts` mendengarkan tombol dan seretan dari halaman induk, karena iframe-nya satu origin. Engine Colorfigures tidak berubah, dan uisfx tidak dimuat lagi di dalam iframe. Tombol langkah dicari dari labelnya di `BUNYI_LANGKAH`, dan `test/suara.test.ts` gagal kalau labelnya tidak sama dengan di `figur/<id>.html`.
- Ketikan di form tidak berbunyi. Hover hanya berbunyi untuk mouse, di benda yang ikut bereaksi saat disorot (`pasangSorotan`). Tautan ke luar juga tidak berbunyi, karena perubahannya terjadi di tab lain.

Menambah bunyi: tambahkan kejadiannya di `BUNYI` (nama cue harus ada di katalog uisfx, dan `test/suara.test.ts` mengeceknya), lalu panggil `suara.mainkan(BUNYI.…)` setelah perubahan yang terlihat terjadi. Untuk proses yang lama, pakai `mulaiLoop` dan `hentikanLoop`, atau `proses()`. Kalau label tombol di figur diganti, ganti juga di `BUNYI_LANGKAH`.

### Menambah atau mengubah aplikasi

1. Teks, tautan, tumpukan teknologi, dan keterangan fitur: `src/data/proyek.ts`.
2. Figur: satu file di `figur/`, didaftarkan di `FIGUR` pada `scripts/buat-figur.mjs` (lihat bagian Figur).
3. Posisi: `src/halaman/tata-letak.ts` untuk potret dan lanskap.
4. Jalankan `pnpm test`. Test tata letak gagal kalau ada sketsa yang keluar halaman atau menindih logo, aplikasi lain, kontak, atau tim. Test yang sama juga gagal kalau kepakan logo menimpa kolom tanggal atau lampu, kalau lampu dan talinya (sampai ditarik penuh) menimpa sketsa, atau kalau sudut yang terlipat menutupi kolom tanggal dan lampu.
5. Kalau namanya memakai huruf yang belum ada di font pensil, `test/font.test.ts` gagal. Tambahkan hurufnya ke `KARAKTER_JUDUL` (lihat bagian Menggambar sketsa).
6. Kalau id aplikasi baru, ubah juga enum `id` di `docs/api/openapi.yaml` dan mock-nya (bilang Bintang di PR).

### Halaman 404

Alamat yang tidak ada dijawab `404.html` dengan status 404, dan Vercel menyajikannya sendiri selama berkasnya ada di akar hasil build. Ceritanya memakai penghapus yang memang ada di halaman utama: angka 404 digambar pensil, lalu stiker penghapus menggosok kaki angka terakhir. Setiap ketukan di stiker menggosok sedikit lagi, sampai `TAHAP` di `src/nyasar.ts` habis, jadi dua angka pertama tetap utuh.

Halaman ini dibangun sendiri lewat `vite.nyasar.config.ts`, setelah build halaman utama, dan hasilnya masuk `dist/nyasar/`. Kalau digabung di satu build, kode bersama dipecah jadi chunk dan bundle halaman utama berubah, padahal anggaran JS-nya tinggal sedikit. `e2e/anggaran.spec.ts` menjaga keduanya terpisah: semua JS di `dist/assets/` tetap ≤ 60 KB gzip, dan semua JS di `dist/nyasar/` ≤ 40 KB gzip.

Kertas, butiran, pensil, dan suaranya memakai modul yang sama dengan halaman utama. Tata letaknya memakai satuan adegan yang sama (`TATA` di `src/nyasar.ts`), kecuali teks dan tombol, yang satu alur di `#bawah` supaya tidak saling tindih di layar kecil.

### Stiker

Stiker dibuat dengan kit [fun-isometric](https://skills.klvn.dev/fun-isometric): bidang datar dengan garis hitam tebal dan sisi tebal, digerakkan keyframe. Pinggiran putih dan bayangannya dari CSS (`#stiker` di `gaya/nyasar.css`), supaya garis hitamnya tetap terlihat di kertas gelap.

- **Figur untuk benda, stiker untuk momen.** Benda di halaman utama tetap figur Colorfigures. Stiker dipakai untuk kejadian sesaat seperti halaman 404, karena dua gaya isometrik yang bersebelahan saling bertabrakan.
- **Kit tidak diubah.** `src/stiker/fun.ts` dan `motions.ts` disalin apa adanya, dan dikecualikan dari oxlint dan Prettier. Stiker baru ditulis di `src/stiker/ikon.ts`, warnanya di `warna.ts`.
- **Anggaran.** Kit dan satu stiker sekitar 6 KB gzip, sedangkan sisa anggaran halaman utama 2 KB, jadi tidak muat. Kalau stiker perlu tampil di halaman utama, ekspor jadi video dan gambar diam dengan `fi export`, supaya tidak menambah JS.

Aturan menggambarnya ada di `SKILL.md` skill-nya (`npx skills add kelvinkn17/skills@fun-isometric`). Alat ceknya butuh Bun, dan bisa dijalankan tanpa memasangnya:

```sh
FI=~/.claude/skills/fun-isometric/bin/fi.mjs
npx -y bun@latest $FI check apps/web/src/stiker/ikon.ts              # wajib lolos
npx -y bun@latest $FI sheet apps/web/src/stiker/ikon.ts penghapus    # lembar frame untuk menilai gerakan
```

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

| Perintah             | Isi                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test`          | Parser path, arsiran, tulisan, lipatan sudut, tata letak (semua sketsa di dalam halaman dan tidak saling tindih, kolom tanggal tidak tertimpa kepakan logo atau sudut terlipat), kontrak (mock divalidasi dengan skema `openapi.yaml`), skrip tata letak di `<head>` sama dengan `hitungUkuran`, `cicil`, fisika tali lanyard, susunan logo di kartu nama, hasil skrip figur (ukuran gambar, lisensi, CSP, muatan luar), letak figur, coretan krayon, header `vercel.json`, suara (cue ada di katalog uisfx, loop berhenti saat berhasil, gagal, ditunda, atau dihentikan, tidak berbunyi sebelum ada gerakan, pilihan tersimpan, satu pemutar walau dipasang ulang, nada dan hadiah ketukan logo, butir gerakan, label tombol figur sama dengan halaman figur), semua teks halaman punya glyph di data font                                                                                                                                                                                                                                                                                                                                                                      |
| `pnpm test:e2e`      | Build produksi dengan mock API di Chrome desktop, Pixel 7, dan iPhone 15 (WebKit): semua sketsa dan figur tergambar, tanpa scroll, lembar setiap aplikasi, figur interaktif (tombol, seret, Escape dari dalam iframe, tema, gagal dimuat, riwayat browser), tentang ke tim ke kontak, kartu nama tim (dibalik dengan Enter atau ketukan, diseret tanpa terbalik), form kontak (galat, terkirim, cadangan email), tema tersimpan, Matrix, kepakan logo, keyboard, corat-coret dan penghapus, gerak dikurangi, suara dengan `AudioContext` tiruan (tidak ada audio sebelum gerakan, satu aksi satu bunyi lewat keyboard maupun pointer, tombol suara tersimpan setelah dimuat ulang, loop penghapus berhenti, ketukan logo naik nadanya, tombol dan putaran figur, goresan pensil, seretan tali, sudut, dan kartu, sorotan mouse, layar pembuka dilewati), halaman 404 (tampil tanpa galat dan tanpa scroll, stiker menggosok angka, gosokan bertahan saat ukuran layar berubah, gerak dikurangi, axe di tema terang dan gelap), axe 0 pelanggaran di halaman (terang, gelap, Matrix) dan semua dialog, dan total JS di build: halaman utama ≤ 60 KB gzip, halaman 404 ≤ 40 KB gzip |
| `pnpm test:produksi` | Smoke test ke produksi tanpa mock (bawaannya `https://wingmanclutch.web.id`, bisa diganti lewat `PRODUKSI_URL`): `/api/proyek` serta jawaban 405, 415, dan 400 `/api/kontak` divalidasi dengan skema `openapi.yaml`, lalu halaman dibuka di Chrome desktop, Pixel 7, dan iPhone 15 dan statistik asli tampil di lembar keempat aplikasi. Tidak ada yang mengirim email, karena kiriman ke `/api/kontak` sengaja salah dan ditolak sebelum batas kirim dan Resend. Jalan setiap hari lewat workflow `Produksi`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |

Sketsa yang sedang bergerak diam (melayang, mengayun) membuat Playwright menganggapnya "tidak stabil", jadi E2E mengetuknya dengan `click({ force: true })`.

## Deploy

Vercel men-deploy `main` dari root repo memakai `vercel.json`: build `pnpm build`, hasil `apps/web/dist`, dan Functions dari `api/`. Proyeknya `wingmanclutch` di akun Kall (`haikalfaruqs-projects`), terhubung ke repo GitHub ini, dan tampil di <https://wingmanclutch.web.id>. Alamat `wingmanclutch.vercel.app` dialihkan permanen (308) ke domain itu lewat `redirects` di `vercel.json`, halaman utamanya juga. Host-nya dicocokkan persis, jadi URL preview (`wingmanclutch-git-…vercel.app`) tidak ikut dialihkan. Pola path-nya `/:path(.*)`, bukan `/:path*`: Vercel mencocokkan `source` secara ketat, jadi `/:path*` melewatkan `/` dan path yang berakhiran `/`. `test/domain.test.ts` menjaga keduanya dengan library routing Vercel sendiri (`@vercel/routing-utils`). Frontend tidak butuh env apa pun.

Kalau perlu memakai Vercel CLI, jalankan `vercel link` di folder sementara, karena perintah itu menulis `.env.local` berisi token. Kalau `/api/proyek` gagal, lembar detail menyembunyikan statistik; kalau `/api/kontak` gagal, form kontak menawarkan email.

Lighthouse mobile 30 Oktober 2026 (Lighthouse 13.6, build produksi lokal, CPU diperlambat 9x supaya setara mesin PageSpeed Insights): sebelum PR `feat/lighthouse-axe` Performa 88–97 (TBT 200–450 ms, CLS 0,044), sesudahnya Performa 99–100 (TBT 60–110 ms, CLS 0). Aksesibilitas dan Best Practices 100, SEO produksi 100 (di `vite preview` lokal 92 karena `/robots.txt` dijawab `index.html`). Yang dulu menahan Performa: semua sketsa dikompilasi di satu tugas pembuka, hujan Matrix digambar penuh walau belum terlihat, dan ubin butiran. Sekarang `Sketsa` baru dikompilasi saat dibutuhkan dan `Papan` mencicilnya per tugas (`cicil` di `engine/animasi.ts`), hujan hanya digambar di bagian yang terlihat, dan butiran dibuat 300 ms setelah halaman jalan. Skrip di `<head>` menghitung tata letak sebelum dicat supaya kaki halaman tidak melompat; kalau skrip itu diubah, hash di CSP ikut diganti (`test/csp.test.ts` memberi hash barunya). Setelah figur masuk (dengan cara ukur yang sama): Performa 99, TBT 100–120 ms, CLS 0, total muatan halaman 365 KiB, termasuk lima gambar figur sekitar 50 KB per gambar. Halaman figur baru dimuat saat lembarnya dibuka. Setelah semua benda jadi figur dan ada layar pembuka (31 Oktober 2026, cara ukur sama, lima kali): Performa 98–99, TBT 40–150 ms, LCP 1,6–1,8 detik, CLS 0, total muatan 503 KiB. Tambahannya sekitar 134 KB gambar: lambang tiga pose, lampu dua keadaan, dan mug. Layar pembuka hanya menukar gambar dan memakai animasi CSS, jadi tidak menambah tugas panjang. Satu run pertama sempat dapat Performa 69 karena tugas panjang berlabel `_lighthouse-eval.js`. Setelah suara antarmuka masuk (31 Oktober 2026, cara ukur sama, dibandingkan dengan `main` di mesin yang sama): Performa 97–98 (`main` 96–99), TBT 120–150 ms (`main` 60–200 ms), LCP 1,7–1,9 detik (`main` 1,6–1,8), CLS 0. Tidak ada tugas panjang dari modul suara, yang dimuat saat browser senggang sebagai chunk terpisah 12 KB gzip.

Ukuran JavaScript (target PRD ≤ 60 KB gzip) dihitung dari semua berkas JS di build, jadi tidak perlu berdebat chunk mana yang terhitung, dan `e2e/anggaran.spec.ts` menjaganya. Setelah suara antarmuka masuk, totalnya sempat 67,9 KB: chunk utama 51,3 KB, modul suara 12,1 KB, lanyard 4,4 KB, dan kunjungan biasa tanpa membuka dialog tim sudah 63,4 KB. Modul suara tidak bisa dikecilkan, karena uisfx satu berkas berisi 12 pack dan tree-shaking tidak mengurangi apa pun. Yang dipangkas `font.json`, yang masih menyimpan semua 95 karakter ASCII: 95 glyph tulisan tangan jadi 40, dan 95 glyph judul jadi 21. Totalnya jadi 56,2 KB, dan glyph yang tersisa sama persis, jadi gambarnya tidak berubah. Setelah bunyi interaksi ditambah, totalnya 57,7 KB: chunk utama 41,1 KB, modul suara 12,1 KB, lanyard 4,4 KB. Angka 0 dan 4 di font judul untuk halaman 404 menambah 0,3 KB, jadi 58 KB.

Tugas panjang berlabel `_lighthouse-eval.js` bukan pekerjaan Lighthouse sendiri, walaupun namanya begitu. Lighthouse membungkus `requestIdleCallback`, jadi callback halaman berjalan di dalam skrip itu. Dibuktikan dengan membuat build tanpa `requestIdleCallback`: tugasnya hilang di semua run. Penyebabnya callback butiran kertas saja, dan modul suara tidak berpengaruh, jadi hanya butiran yang dipindah ke `setTimeout`. Hasilnya (1 November 2026, build lokal, cara ukur sama, enam run selang-seling): Performa dari median 97 (95–99) jadi 99 (96–99), TBT dari median 164 ms jadi 39,5 ms, LCP tetap. Memindahkan butiran ke elemen sendiri supaya tidak memakai custom property di `:root` juga sudah dicoba, dan tidak menolong. Safari tidak punya `requestIdleCallback`, jadi sejak awal memakai `setTimeout` yang sama. Di produksi setelah itu (1 November 2026, cara ukur sama, enam run): Performa median 98 (95–98), TBT median 75 ms, LCP 1,5–1,7 detik, CLS 0, total muatan 508 KiB. Ukur beberapa menit setelah deploy: run yang langsung menyusul deploy sempat dapat LCP sampai 2,4 detik, lalu kembali normal.

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
- [x] Suara antarmuka (uisfx pack zen) dengan tombol suara di kaki halaman
- [x] Unit test dan E2E di tiga perangkat
- [x] Gambar README, gambar OG, dan diagram arsitektur Archify
- [x] Deploy halaman ke Vercel (`wingmanclutch.vercel.app`), terhubung ke repo
- [x] Domain `wingmanclutch.web.id`: canonical dan gambar OG pindah ke sana, `wingmanclutch.vercel.app` dialihkan permanen
- [x] Lighthouse mobile ≥ 95 di keempat kategori (baseline di bagian Deploy), axe 0 pelanggaran di halaman dan semua dialog
- [x] Cek alur kontak dan statistik di produksi bersama Bintang, setelah `api/` jadi
- [x] Ganti mock dengan backend sungguhan di E2E produksi (smoke test), setelah `api/` jadi
