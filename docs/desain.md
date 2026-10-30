# Identitas Visual

Halaman Wingman Clutch adalah satu halaman buku catatan kotak-kotak. Semua yang ada di atasnya dicoret pensil di depan pengunjung, dan pengunjung boleh ikut mencoret.

## Logo

Logo brand ada di [`docs/brand/`](brand/): lambang dua orang bersayap yang membentuk huruf W, tulisan WINGMAN dan CLUTCH, dan tagline *Two is enough to win.*

| Berkas | Pakai untuk |
| --- | --- |
| `wingman-clutch-logo.svg` / `.png` | Logo utama bertumpuk, sumber logo pensil di halaman |
| `wingman-clutch-horizontal.svg` | Logo mendatar di latar terang |
| `wingman-clutch-horizontal-gelap.svg` | Logo mendatar di latar `#101828` |
| `wingman-clutch-emblem.svg` | Lambang saja, sumber favicon |
| `wingman-clutch-ikon.png`, `wingman-clutch-avatar.png` | Ikon aplikasi dan avatar 1024 px |

Di halaman, logo digambar ulang oleh mesin pensil dari `wingman-clutch-logo.svg` (skrip `apps/web/scripts/buat-logo.mjs` menghaluskan tepi hasil tracing). Lambang dan tulisan diarsir grafit dengan bayangan biru yang bergeser sedikit, tagline ditulis tangan.

## Warna

Warna brand: navy `#101828` dan krem `#F7F6F1`. Kertas terang memakai krem brand.

| Kode | Pensil | Terang | Gelap |
| --- | --- | --- | --- |
| `w` | grafit | `#22252F` | kapur `#ECEAE2` |
| `k` | hitam (isi layar perangkat) | `#0D0F16` | `#F6F4EC` |
| `e` | warna kertas (penghapus) | `#F7F6F1` | `#161922` |
| `y` | kuning | `#EFB21A` | `#F6C33C` |
| `p` | pink | `#E4589C` | `#F075B0` |
| `b` | biru | `#2F74D0` | `#5B97E6` |
| `g` | hijau | `#2F9A52` | `#4CB86C` |
| `o` | oranye | `#EE7A24` | `#F59447` |
| `r` | merah | `#D8432F` | `#EA6450` |
| `n` | cokelat | `#8B5A36` | `#B27D55` |

Tema Matrix memetakan semua pensil ke hijau di atas kertas hitam `#020604`. Sumber kebenarannya `apps/web/src/engine/kuas.ts` (tinta) dan `apps/web/src/halaman/kertas.ts` (kertas, garis kotak, noda kopi).

Setiap aplikasi punya satu warna pensil untuk garis bawah namanya dan bayangan judul di lembar detailnya: PostPocket pink, goRute biru, Tikoem merah, Tookthel hijau.

## Huruf

| Huruf | Dipakai untuk | Bentuk |
| --- | --- | --- |
| EMS Tech | Tulisan tangan di halaman: tanggal, petunjuk, isi layar perangkat | Satu goresan, digambar oleh mesin pensil |
| Bungee | Judul tebal: nama aplikasi, TENTANG KAMI, TIM KAMI, LET'S CLUTCH IT | Outline yang diarsir, dengan bayangan warna |
| Special Elite | Teks dialog, tombol, kaki halaman | Webfont mesin ketik |

Sumber dan lisensinya di [assets.md](assets.md).

## Aturan

- Semua gambar di halaman digambar oleh mesin pensil, bukan berkas gambar. Pengecualian: pensil dan penghapus di baki (SVG dan CSS yang tampak nyata, sengaja kontras dengan sketsa), foto tim, dan kertas tempel kuning.
- Garis tidak pernah sempurna: setiap goresan bergoyang sedikit, ujungnya kebablasan, dan garis tepi ditarik dua kali.
- Isi berwarna diarsir, tidak diblok rata. Sudut arsir berbeda-beda per bidang supaya terasa tangan.
- Teks di halaman ditulis huruf kapital, pendek, dan berbahasa Indonesia santai. Istilah yang memang Inggris (Let's clutch it, Two is enough to win) dibiarkan.
- Dialog adalah kertas kotak yang ditempel selotip dan sedikit miring. Judulnya digambar mesin pensil, garis bawahnya merah.
- Gerak diam perangkat halus (goyang, ayun, melayang, denyut) dan berhenti total di `prefers-reduced-motion`.
