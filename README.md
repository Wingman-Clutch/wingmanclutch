<!-- markdownlint-disable MD013 MD033 MD041 -->

<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/brand/wingman-clutch-horizontal-gelap.svg" />
  <img src="docs/brand/wingman-clutch-horizontal.svg" width="420" alt="Wingman Clutch. Two is enough to win." />
</picture>

# Web Porto Wingman Clutch

**Setiap proyek mulai dari coretan.**

Satu halaman buku catatan yang memperlihatkan empat aplikasi Wingman Clutch,<br />
digambar pensil di depan mata pengunjung.

</div>

> [!NOTE]
> **Repo ini baru dimulai.** Rencana lengkapnya ada di [PRD](docs/prd/PRD-WingmanClutch.md). Halaman frontend dikerjakan Kall, backend dikerjakan Bintang, dan keduanya bertemu di [kontrak API](docs/api/openapi.yaml), jadi tidak ada yang perlu menunggu.

## Pembagian kerja

| Bagian | Pemilik | Mulai dari |
| --- | --- | --- |
| Halaman buku catatan (`apps/web/`) | Kall ([@HaikalFaruq](https://github.com/HaikalFaruq)) | [docs/frontend.md](docs/frontend.md) |
| Vercel Functions `kontak` dan `proyek` (`api/`) | Bintang ([@bintangfabian](https://github.com/bintangfabian)) | [docs/backend.md](docs/backend.md) |
| Kontrak API | Bintang menulis, Kall me-review | [docs/api/openapi.yaml](docs/api/openapi.yaml) |

## Mulai

Butuh Node.js 24 (`.nvmrc`) dan pnpm 9.

```sh
git clone https://github.com/Wingman-Clutch/wingmanclutch.git
cd wingmanclutch
pnpm install          # sekalian mengaktifkan hook git
```

## Dokumentasi

| Dokumen | Isi |
| --- | --- |
| [AGENTS.md](AGENTS.md) | Aturan kerja untuk manusia dan AI agent, termasuk larangan atribusi AI |
| [PRD](docs/prd/PRD-WingmanClutch.md) | Sumber kebenaran produk: cakupan, pemetaan dari referensi, kontrak, rencana kerja paralel |
| [Panduan frontend](docs/frontend.md) | Cara kerja halaman, mesin pensil, dan checklist Kall |
| [Panduan backend](docs/backend.md) | Rancangan endpoint, keamanan, dan checklist Bintang |
| [Identitas visual](docs/desain.md) | Logo, warna pensil, huruf, dan aturan desain |
| [Aset dan lisensi](docs/assets.md) | Sumber dan lisensi setiap aset |
| [Referensi](docs/referensi/kracked-studio.md) | Catatan cara kerja kracked.studio yang ditiru di rilis 1 |

## Berkontribusi

Alur lengkapnya di [`AGENTS.md`](AGENTS.md): branch per topik, PR dengan bagian Apa yang berubah, Kenapa, Sudah dicek, dan Selanjutnya, pasangan sebagai co-author, tanpa atribusi AI, lalu merge commit setelah CI hijau.

## Tim

<table>
  <tr>
    <td align="center"><a href="https://github.com/HaikalFaruq"><img src="https://github.com/HaikalFaruq.png?size=96" width="72" alt="Muhammad Haikal Faruq" /><br /><b>Muhammad Haikal Faruq</b></a><br /><sub>Frontend, desain, ilustrasi</sub></td>
    <td align="center"><a href="https://github.com/bintangfabian"><img src="https://github.com/bintangfabian.png?size=96" width="72" alt="Bintang Fabian Putra" /><br /><b>Bintang Fabian Putra</b></a><br /><sub>Backend, keamanan, data</sub></td>
  </tr>
</table>
