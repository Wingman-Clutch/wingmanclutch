# PRD: Web Porto Wingman Clutch

| | |
| --- | --- |
| Pemilik produk | Kall dan Bintang |
| Frontend | Kall ([@HaikalFaruq](https://github.com/HaikalFaruq)) |
| Backend | Bintang ([@bintangfabian](https://github.com/bintangfabian)) |
| Status | Halaman live sejak 30 Oktober 2026, sekarang di [wingmanclutch.web.id](https://wingmanclutch.web.id) (`wingmanclutch.vercel.app` dialihkan ke sana). Backend: `POST /api/kontak` dan `GET /api/proyek` live, env produksi lengkap sejak 30 Oktober 2026 |
| Referensi | [kracked.studio](https://kracked.studio), catatan di [docs/referensi/kracked-studio.md](../referensi/kracked-studio.md) |
| Terakhir diubah | 31 Oktober 2026 |

## 1. Latar belakang

Wingman Clutch adalah tim dua orang (org GitHub [Wingman-Clutch](https://github.com/Wingman-Clutch)) yang sudah merilis empat aplikasi web: PostPocket, Tikoem, goRute, dan Tookthel. Sampai sekarang belum ada satu tempat yang memperlihatkan semuanya beserta orang di baliknya. Halaman profil org di GitHub hanya terbaca oleh orang yang sudah tahu GitHub.

Kami mau web porto yang terasa seperti kami: main-main, buatan tangan, dan jelas soal apa yang sudah kami kirim. Gaya buku catatan kracked.studio pas dengan itu: semua gambar dicoret pensil di depan mata pengunjung, dan pengunjung boleh ikut corat-coret.

Di mini project sebelumnya, salah satu dari kami sering menunggu yang lain selesai dulu. PRD ini sengaja memisahkan pekerjaan frontend dan backend dengan kontrak API, supaya keduanya bisa jalan bersamaan dari hari pertama.

## 2. Tujuan

1. **Satu link untuk semua karya.** Pengunjung paham siapa Wingman Clutch, melihat keempat aplikasi, lalu membuka yang menarik dalam satu menit.
2. **Bisa dihubungi tanpa ribet.** Pengunjung yang punya ide bisa mengirim pesan langsung dari halaman, atau lewat email kalau server sedang bermasalah.
3. **Kerja paralel.** Kall dan Bintang tidak saling menunggu: frontend jalan dengan mock dari kontrak, backend jalan dengan test dari kontrak yang sama.
4. **Menunjukkan kemampuan.** Halamannya sendiri jadi bukti: mesin pensil buatan sendiri, tanpa framework, cepat di HP.

### Ukuran berhasil

| Ukuran | Target rilis 1 |
| --- | --- |
| Lighthouse mobile (Performa, Aksesibilitas, Best Practices, SEO) | Semua ≥ 95 |
| JavaScript yang dikirim (gzip) | ≤ 60 KB, tanpa framework |
| Semua sketsa selesai digambar | ≤ 3,5 detik setelah halaman terbuka |
| Pesan kontak sampai ke wingmanclutch@gmail.com | ≤ 1 menit setelah dikirim |
| Pelanggaran axe di semua dialog | 0 |

## 3. Pengunjung

| Siapa | Datang dari | Yang dicari |
| --- | --- | --- |
| Calon klien atau rekan kerja | Link di CV, LinkedIn, atau chat | Apa saja yang pernah kami buat, dan cara menghubungi |
| Teman dan pengguna aplikasi kami | Link di README atau media sosial | Aplikasi lain dari tim yang sama |
| Rekruter | Profil GitHub | Siapa orangnya, peran masing-masing, dan bukti kerja |

## 4. Cakupan rilis 1

Rilis 1 berangkat dari kracked.studio: tata letak, urutan menggambar, dan interaksinya dibuat mirip, isinya milik Wingman Clutch. Pada 31 Oktober 2026 Kall dan Bintang sepakat bergeser dari tiruan 1:1 supaya gaya halamannya seragam: semua benda di halaman jadi figur Colorfigures (empat aplikasi, tim, lambang, lampu, kopi), halaman dibuka dengan layar pembuka berisi lambang yang mengepak, dan tema diganti lewat tali lampu gantung. Tulisan, catatan, dan coretan tetap digambar mesin pensil.

### 4.1 Pemetaan dari referensi

| kracked.studio | Wingman Clutch | Pemilik |
| --- | --- | --- |
| Kertas kotak-kotak, butiran kertas, noda cincin kopi | Sama, dengan warna kertas krem brand `#F7F6F1` | Kall |
| (tidak ada) | Layar pembuka: lambang figur muncul di tengah kertas, mengepakkan sayap dua kali, lalu meluncur ke tempatnya sebelum halaman digambar. Sekali per sesi, bisa dilewati, tidak tampil di gerak dikurangi | Kall |
| Logo Kracked (monster dan tulisan) digambar pensil, lalu retak | Lambang dua orang bersayap sebagai figur Colorfigures, lalu WINGMAN, CLUTCH, dan tagline ditulis pensil. Setiap ketukan mengepakkan sayap lambang dan menambah garis kepak (sampai 4) | Kall |
| Kolom DATE berisi tanggal hari ini | Kolom TANGGAL, nama bulan Indonesia | Kall |
| Bulan dan matahari untuk tema terang dan gelap | Lampu gantung bertali: ditarik untuk mematikan lampu (kertas gelap) atau menyalakannya (kertas terang). Pilihan disimpan di perangkat | Kall |
| Sudut kanan atas bisa dikupas ke Matrix | Sama | Kall |
| Empat kategori (Games, Websites, Apps, Art) dengan layar yang berganti | Empat aplikasi, masing-masing satu figur berwarna: PostPocket (amplop dan kartu foil), goRute (halte dan bus TransJakarta), Tikoem (HP dengan peta di dudukan), Tookthel (printer struk dan koin) | Kall |
| Lembar proyek saat sketsa diketuk | Lembar detail aplikasi: figur interaktif yang bisa diputar dan dicoba, deskripsi, tiga fitur, peran kami, tumpukan teknologi, statistik hidup, tautan aplikasi dan kode | Kall (tampilan), Bintang (statistik) |
| Kertas tempel ABOUT US | TENTANG KAMI dengan nama Kall dan Bintang, dialog berisi siapa kami dan cara kami bagi kerja | Kall |
| THE TEAM dengan lima orang | TIM KAMI: figur dua orang tos. Dialog berisi kartu nama berlanyard dengan foto sketsa pensil dari profil GitHub | Kall |
| Kotak DO NOT ERASE, GOT AN IDEA? LET'S KRACK IT | HUBUNGI KAMI, PUNYA IDE? LET'S CLUTCH IT, membuka form kontak | Kall (form), Bintang (pengiriman) |
| ART + CODE = ♥ | FE + BE = ♥ | Kall |
| TODAY: tally kopi | KOPI HARI INI: tally kopi di samping figur mug | Kall |
| Lima pensil untuk corat-coret | Sama, dengan stempel WINGMAN CLUTCH | Kall |
| Penghapus menggosok seluruh halaman lalu semuanya digambar ulang | Sama, termasuk remah dan bekas gosokan | Kall |
| Kaki halaman | © 2026 Wingman Clutch, tautan GitHub dan Traktir kopi (Sociabuzz), dan tombol suara | Kall |
| (tidak ada) | Bunyi antarmuka dari UI SFX pack zen (lipatan kertas, kuas, kayu) saat lembar dibuka dan ditutup, lampu ditarik, sudut dikupas, kartu dibalik, pensil dipilih, halaman dihapus, dan pesan dikirim. Nyala sampai pengunjung mematikannya; pilihannya disimpan di perangkat | Kall |
| `POST /api/contact` | `POST /api/kontak` | Bintang |
| (tidak ada) | `GET /api/proyek`: star GitHub, push terakhir, status online setiap aplikasi | Bintang |

### 4.2 Alur pengunjung

1. Halaman terbuka. Tanggal dan logo digambar pensil, lalu keempat figur aplikasi diarsir masuk berurutan dalam ±3 detik.
2. Pengunjung mengetuk sebuah figur. Lembar detail aplikasinya ditempel di atas halaman, dengan figur yang bisa diputar dan dicoba. Dari sana pengunjung membuka aplikasinya atau kodenya di tab baru.
3. Pengunjung mengetuk TENTANG KAMI, lalu "kenalan sama tim", lalu "ajak kerja bareng". Form kontak terbuka.
4. Pengunjung mengisi nama, email, dan pesannya, lalu mengirim. Pesan terkirim, atau kalau server gagal, email dengan isi yang sama sudah disiapkan.
5. Kapan saja, pengunjung bisa mengambil pensil dan mencoret halaman, menghapus semuanya, mengganti tema, atau mengupas sudut halaman.

### 4.3 Persyaratan frontend (Kall)

- Halaman satu layar tanpa scroll. Dua tata letak: potret (HP, rasio lebar/tinggi < 0,92) dan lanskap. Semua muat dari 320 px sampai 4K.
- Logo, tulisan, dan catatan digambar oleh mesin pensil di `<canvas>`, bukan gambar statis, dan selalu tampak sama setiap digambar ulang (benih acak per sketsa). Figur aplikasi dan tim adalah gambar Colorfigures yang dilukis ke kanvas dengan coretan krayon, jadi ikut terhapus penghapus.
- Tema terang, gelap, dan Matrix. Tema terang atau gelap mengikuti sistem sampai pengunjung memilih sendiri.
- Aksesibilitas: setiap sketsa yang bisa diketuk adalah `<button>` berlabel, dialog memakai `<dialog>` dengan judul, fokus kembali ke sketsa asal setelah dialog ditutup, dan Escape menutup dialog serta keluar dari mode corat-coret. `prefers-reduced-motion` menggambar semuanya seketika tanpa gerak diam.
- Suara hanya menguatkan tanda yang terlihat, tidak pernah satu-satunya tanda. Tidak ada yang berbunyi sebelum pengunjung mengetuk atau menekan tombol, dan tombol suara di kaki halaman mematikannya seketika.
- Form kontak memeriksa kolom di browser dengan aturan yang sama dengan backend, menampilkan galat per kolom, dan punya cadangan email (mailto berisi pesan yang sama, plus tombol salin).
- Tidak ada cookie, analitik pihak ketiga, atau permintaan ke domain lain kecuali font yang di-bundle sendiri.

### 4.4 Persyaratan backend (Bintang)

Rinciannya di [docs/backend.md](../backend.md). Ringkasnya:

- `POST /api/kontak` meneruskan pesan ke wingmanclutch@gmail.com lewat Resend, dengan `Reply-To` ke email pengirim. Validasi sama persis dengan kontrak, jebakan bot `situs`, batas 5 pesan per jam per jaringan (IP di-hash), body maksimal 16 KB.
- `GET /api/proyek` mengambil star dan `pushed_at` keempat repo dari GitHub, mengecek URL produksi dengan HEAD (5 detik), lalu di-cache CDN satu jam.
- Tidak ada database di rilis 1. Pesan kontak tidak disimpan di server; email adalah arsipnya.
- Galat tidak pernah membocorkan detail internal. Log Functions tidak memuat isi pesan, email, maupun IP mentah.

### 4.5 Kontrak API

Sumber kebenarannya [`docs/api/openapi.yaml`](../api/openapi.yaml). Mock frontend (`apps/web/mock/api.ts`) mengikuti kontrak itu dan divalidasi oleh unit test, jadi kalau kontrak berubah tanpa mock ikut berubah, CI merah.

| Endpoint | Sukses | Galat |
| --- | --- | --- |
| `POST /api/kontak` | `202 { status: "terkirim" }` | `400 INPUT_TIDAK_VALID` (dengan daftar kolom), `413`, `415`, `429 TERLALU_SERING` (dengan `Retry-After`), `503 LAYANAN_GAGAL` |
| `GET /api/proyek` | `200 { diperbarui, proyek: [ { id, bintang, terakhirDiperbarui, status } ] }` | `503 LAYANAN_GAGAL` |

Frontend tidak pernah bergantung pada backend untuk tampil: kalau `/api/proyek` gagal, baris statistik disembunyikan; kalau `/api/kontak` gagal, pengunjung diarahkan ke email.

## 5. Bukan cakupan rilis 1

- CMS atau halaman admin. Isi diubah lewat `apps/web/src/data/proyek.ts` dan PR.
- Blog, studi kasus panjang, dan halaman per aplikasi.
- Versi bahasa Inggris.
- Menyimpan coretan pengunjung di server atau membagikannya.
- Analitik dan cookie.

## 6. Arsitektur

```text
Pengunjung ──> Vercel (CDN)
                 ├── /            apps/web/dist: HTML, JS, CSS, font, foto tim (statis)
                 ├── /api/kontak  Vercel Function ──> Resend ──> wingmanclutch@gmail.com
                 │                         └──────> Upstash Redis (batas kirim)
                 └── /api/proyek  Vercel Function ──> GitHub REST API, HEAD ke 4 aplikasi
```

Diagram interaktifnya ada di [docs/arsitektur.html](https://wingman-clutch.github.io/wingmanclutch/arsitektur.html), sumbernya [`docs/arsitektur.archify.json`](../arsitektur.archify.json).

| Bagian | Pilihan | Alasan |
| --- | --- | --- |
| Frontend | Vite 8 + TypeScript, tanpa framework | Halamannya satu layar penuh canvas; framework hanya menambah berat |
| Gambar | Mesin pensil sendiri di `apps/web/src/engine` | Inti rasa halaman; tidak ada pustaka yang memberi hasil serupa |
| Huruf | EMS Tech (tulisan tangan satu goresan), Bungee (judul), Special Elite (teks dialog), semuanya lisensi terbuka | Lihat [docs/assets.md](../assets.md) |
| Backend | Vercel Functions di `api/`, satu domain dengan halaman | Tanpa CORS, satu deploy, gratis |
| Email | Resend | Gratis 3.000 email per bulan, API sederhana |
| Batas kirim | Upstash Redis | Gratis, bisa dipanggil dari Functions lewat HTTP |
| Hosting | Vercel, akun Kall (`haikalfaruqs-projects`), dari `main` | Sama seperti PostPocket dan Tikoem |

## 7. Rencana kerja paralel

Kedua jalur dimulai bersamaan. Titik temunya hanya kontrak API.

| Minggu | Kall (frontend) | Bintang (backend) |
| --- | --- | --- |
| 1 | Halaman 1:1 dengan mock (PR #1), review kontrak | Baca kontrak, siapkan `api/` dan test, pilih penyimpanan batas kirim |
| 1 | Gambar README dan diagram arsitektur | `POST /api/kontak` dengan Resend, test validasi dan batas kirim |
| 2 | Lighthouse dan axe, perbaiki temuan | `GET /api/proyek` dengan cache, test dengan GitHub tiruan |
| 2 | Deploy Vercel bersama, cek produksi end to end | Env produksi di Vercel, cek produksi end to end |

Checklist rinci ada di [docs/frontend.md](../frontend.md#checklist) dan [docs/backend.md](../backend.md#checklist). Setiap PR mencentang item yang dikerjakannya.

## 8. Kriteria selesai rilis 1

- [ ] Semua item checklist frontend dan backend tercentang.
- [ ] Produksi di Vercel menampilkan halaman 1:1 di Chrome Android, Safari iOS, dan desktop.
- [ ] Pesan uji dari produksi sampai ke wingmanclutch@gmail.com, dan kiriman ke-6 dalam satu jam ditolak 429.
- [ ] Lembar detail di produksi menampilkan statistik dari GitHub.
- [ ] Ukuran berhasil di bagian 2 tercapai, dicek dengan Lighthouse mobile dan axe.
- [ ] README berisi link produksi dan gambar dari produksi.

## 9. Keputusan yang menunggu

| Keputusan | Pilihan | Usulan | Siapa |
| --- | --- | --- | --- |
| Domain | `wingmanclutch.vercel.app` atau beli domain | Diputuskan: `wingmanclutch.web.id`, berlaku sampai 28 Oktober 2027. `wingmanclutch.vercel.app` dialihkan permanen ke sana | Berdua |
| Penyimpanan batas kirim | Upstash Redis atau di memori per instance | Diputuskan: Upstash, di memori hanya cadangan lokal ([backend.md](../backend.md#keputusan)) | Bintang |
| Pengirim email | `onboarding@resend.dev` (hanya ke email pemilik akun Resend) atau domain sendiri | Diputuskan: akun Resend wingmanclutch@gmail.com, pengirim `onboarding@resend.dev` ([backend.md](../backend.md#keputusan)) | Bintang |
| Lisensi repo | MIT seperti Tikoem, atau tanpa lisensi | Kode MIT, tapi logo, foto tim, dan isi tetap milik Wingman Clutch | Berdua |
| Foto tim | Foto profil GitHub sekarang, atau foto khusus | Foto profil GitHub dulu | Berdua |
| Tally KOPI HARI INI | Lelucon kopi statis seperti referensi, atau jumlah pengunjung hari ini dari backend | Statis di rilis 1 | Berdua |

## 10. Risiko

| Risiko | Dampak | Penanganan |
| --- | --- | --- |
| Terlalu mirip referensi | Dianggap menjiplak | Kode dan gambar ditulis sendiri, aset referensi tidak disalin (AGENTS.md bagian 8). Setelah rilis 1, gaya dipoles jadi milik kami sendiri |
| Canvas berat di HP lama | Halaman patah-patah | Mesin hanya menggambar bagian baru setiap frame, layar yang berganti memakai kanvas terpisah, dan semua animasi berhenti saat `prefers-reduced-motion` |
| Spam form kontak | Inbox penuh | Jebakan bot, batas kirim per jaringan, dan validasi di server |
| Batas GitHub API tanpa token | Statistik kosong | Cache CDN satu jam dan token baca opsional |
