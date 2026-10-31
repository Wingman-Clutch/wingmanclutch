# Panduan Backend

Untuk Bintang dan agent yang membantu Bintang. Baca [AGENTS.md](../AGENTS.md) dan [PRD](prd/PRD-WingmanClutch.md) dulu.

Frontend sudah jalan dengan mock dari kontrak, jadi backend bisa dikerjakan kapan saja tanpa menunggu Kall. Yang dikerjakan di sini hanya dua endpoint, tanpa database.

## Cakupan

| Endpoint | Fungsi |
| --- | --- |
| `POST /api/kontak` | Terima pesan dari form "Let's clutch it", kirim ke wingmanclutch@gmail.com lewat Resend |
| `GET /api/proyek` | Star GitHub, push terakhir, dan status online keempat aplikasi, di-cache CDN satu jam |

Kontraknya [`docs/api/openapi.yaml`](api/openapi.yaml). Kalau perlu mengubah bentuk data, ubah kontraknya dulu lewat PR yang di-review Kall, termasuk mock di `apps/web/mock/api.ts` (unit test frontend memvalidasi mock dengan kontrak, jadi CI merah kalau keduanya tidak sejalan).

## Keputusan

Diputuskan Bintang di PR `feat/api-kontak`, mengikuti usulan awal.

| Keputusan | Pilihan | Catatan |
| --- | --- | --- |
| Penyimpanan batas kirim | Upstash Redis (gratis) lewat `@upstash/ratelimit`, jendela geser 5 per jam | Batas di memori bisa ditembus karena instance Functions berganti-ganti, jadi hanya dipakai sebagai cadangan kalau env Upstash kosong (lokal). Kalau Upstash sedang mati, pesan tetap dikirim supaya form tidak tertutup |
| Pengirim email | Akun Resend didaftarkan dengan wingmanclutch@gmail.com. Sejak 31 Oktober 2026 pengirimnya `Wingman Clutch <kontak@wingmanclutch.web.id>`, di Production dan Preview | Domain `wingmanclutch.web.id` diverifikasi di Resend (region Tokyo) lewat record DKIM (`resend._domainkey`), SPF (`send`, `rsend`), dan DMARC di DNS indo.domains. Domain itu tidak punya MX, jadi `kontak@` hanya mengirim; balasan sampai ke pengunjung lewat `reply_to`. Sebelumnya pengirimnya `onboarding@resend.dev`, yang hanya bisa mengirim ke email pemilik akun. Kalau log mencatat `Resend menjawab 403`, cek status domain di Resend: kiriman dari domain yang belum Verified ditolak `403`. Resend dipanggil lewat `fetch` langsung, tanpa SDK. Kalau log mencatat `Resend menjawab 400`, cek dulu isi `RESEND_API_KEY`: Resend menjawab `400` untuk key yang ikut tanda kutip, `RESEND_API_KEY=`, atau spasi, dan `401` untuk key salah yang bentuknya wajar. Nilainya Sensitive di Vercel dan tidak bisa dibaca ulang, jadi timpa saja dengan key mentah yang diawali `re_` |
| Token GitHub | Fine-grained, hanya `Public Repositories (read-only)`, terpasang di Production sejak 30 Oktober 2026, **kedaluwarsa 29 Oktober 2027** | Kode tetap jalan tanpa token, tapi batas 60 permintaan per jam tanpa token dihitung per IP, dan IP keluar Vercel Functions dipakai bersama banyak proyek lain, jadi kuotanya bisa habis duluan walau cache kita satu jam. Org Wingman-Clutch menolak token fine-grained yang berlaku lebih dari 366 hari (GitHub menjawab 403), jadi token pengganti juga maksimal 366 hari. Ganti sebelum 29 Oktober 2027, karena token kedaluwarsa dijawab GitHub `401` (bukan `403` seperti penolakan kebijakan org) dan statistik jadi 503 |

## Struktur yang disarankan

```text
api/
  package.json          @wingmanclutch/api (masuk pnpm-workspace.yaml, sudah terdaftar)
  tsconfig.json
  kontak.ts             rute POST /api/kontak, hanya memanggil _lib/kontak.ts
  proyek.ts             rute GET /api/proyek
  _lib/                 bukan rute (awalan _ diabaikan Vercel)
    kontak.ts           logika /api/kontak, pembatas dan pengirim bisa diganti tiruan di test
    validasi.ts         aturan kolom, sama dengan kontrak
    batas.ts            batas kirim per jaringan
    email.ts            kirim lewat Resend
    github.ts           statistik repo dan cek status
    jawab.ts            helper JSON dan galat
  _test/                vitest, plus kontrak.ts untuk validasi skema
```

Vercel menjalankan setiap file `.ts` di `api/` sebagai Function Node, jadi jangan menaruh file `.ts` lain (misalnya config Vitest) langsung di `api/`. Rute memakai bentuk Web standar `export default { fetch(req) }`, dan impor antarfile memakai akhiran `.js` (ESM, `moduleResolution: NodeNext`). `undici-types` sengaja jadi devDependency langsung `api/`, dengan versi yang sama persis dengan yang dipakai `@types/node`: builder `@vercel/node` tidak mengikuti symlink pnpm, jadi tanpa itu tipe `Request` dan `Response` kosong dan log build mencetak `error TS2339`. Kalau `@types/node` naik versi, samakan versinya (cek dengan `ls node_modules/.pnpm | grep undici-types`, lalu `cd api && npx tsc --noEmit --preserveSymlinks`). `vercel.json` di root sudah menunjuk build frontend ke `apps/web/dist`, jadi Functions dan halaman ikut satu deploy dan satu domain (tanpa CORS).

## Rancangan endpoint

### `POST /api/kontak`

Urutannya:

1. Tolak metode selain POST dengan `405` dan header `Allow: POST`.
2. Tolak `Content-Type` selain `application/json` dengan `415`.
3. Baca body maksimal 16 KB, lebih dari itu `413`. JSON rusak `400 INPUT_TIDAK_VALID`.
4. Kalau `situs` terisi, jawab `202` dan berhenti tanpa mengirim apa pun.
5. Validasi dengan aturan kontrak (pangkas spasi dulu): `nama` 1 sampai 80, `email` maksimal 254 dan berformat email, `pesan` 10 sampai 2000. Kolom yang salah dijawab `400` dengan daftar `kolom` berisi `{ kolom, alasan }`, alasan salah satu dari `wajib`, `terlalu_pendek`, `terlalu_panjang`, `format`. Urutan dan kalimatnya bisa disamakan dengan `periksaKontak` di `apps/web/src/api/kontrak.ts`.
6. Batas kirim: kunci `sha256(GARAM_IP + ip)` (Function mencatat peringatan sekali kalau `GARAM_IP` kosong di production), 5 pesan per jam (jendela geser). Ambil IP dari header `x-forwarded-for` paling kiri yang diisi Vercel. Kalau habis, `429 TERLALU_SERING` dengan `cobaLagiDetik` dan header `Retry-After` yang sama. Langkah 1 sampai 5 harus tetap di depan langkah ini: smoke test produksi (`pnpm test:produksi`) mengirim kiriman salah setiap hari dan tidak boleh memakai kuota; test `kiriman yang ditolak tidak memakai kuota batas kirim` menjaganya.
7. Kirim email lewat Resend:
   - `from`: `KONTAK_PENGIRIM`, `to`: `KONTAK_TUJUAN`, `reply_to`: email pengirim.
   - Subjek `Ide dari <nama>` (nama dipotong 60 karakter, tanpa baris baru).
   - Isi teks biasa: pesan, lalu nama dan email. Jangan kirim HTML yang dirakit dari input.
8. Resend gagal atau lebih dari 8 detik: `503 LAYANAN_GAGAL`. Frontend lalu menawarkan email langsung.
9. Berhasil: `202 { status: "terkirim" }`.

Yang tidak boleh: menyimpan isi pesan, mencatat isi pesan atau email atau IP mentah ke log, dan memberi detail galat internal ke pengunjung.

### `GET /api/proyek`

Daftar repo dan URL ada di `api/_lib/github.ts` (`APLIKASI`). Test membandingkannya dengan `apps/web/src/data/proyek.ts`, jadi kalau Kall mengganti URL aplikasi, test backend ikut merah sampai daftarnya disamakan.

1. Untuk keempat repo (`Wingman-Clutch/PostPocket`, `tikoem`, `goRute`, `tookthel`), ambil `stargazers_count` dan `pushed_at` dari `GET https://api.github.com/repos/{owner}/{repo}`, dengan header `Authorization: Bearer $GITHUB_TOKEN` kalau token ada.
2. Bersamaan, kirim `HEAD` ke URL produksi setiap aplikasi (lihat `apps/web/src/data/proyek.ts`) dengan batas 5 detik. 2xx atau 3xx berarti `online`, galat atau lewat waktu berarti `gangguan`, dan kalau pengecekan tidak bisa dilakukan sama sekali `tidak_diketahui`.
3. Jawab `200` dengan `Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400`, supaya CDN Vercel yang menahan beban dan GitHub jarang dipanggil.
4. Repo yang gagal diisi nilai terakhir yang berhasil di instance itu, lalu dijawab `200` dengan cache lima menit (`s-maxage=300`) supaya cepat pulih. Kalau ada repo yang gagal dan belum punya nilai terakhir, jawab `503 LAYANAN_GAGAL` tanpa cache, supaya halaman menyembunyikan baris statistik daripada menulis "★ 0 · baru saja". Status tetap dari cek HEAD, karena tidak bergantung pada GitHub. Urutan id mengikuti enum di kontrak.

## Keamanan

- Secret hanya di Environment Variables Vercel (Production dan Preview) dan `.env` lokal. Contohnya di [`.env.example`](../.env.example). Hook `pre-commit` menolak key Resend dan token GitHub, dan secret scanning GitHub menyala.
- Validasi semua input di server walaupun frontend sudah mengecek.
- Header keamanan halaman sudah diatur di `vercel.json`. Functions menjawab JSON dengan `Content-Type: application/json; charset=utf-8` dan `Cache-Control: no-store` untuk `/api/kontak`.
- Tidak ada CORS karena satu domain. Jangan tambahkan `Access-Control-Allow-Origin: *`.

## Menjalankan lokal

```sh
cp .env.example .env        # isi RESEND_API_KEY dan lainnya
npx vercel@latest link      # sekali, pilih proyek wingmanclutch di haikalfaruqs-projects
npx vercel@latest dev       # halaman dan Functions di http://localhost:3000
```

`vercel link` menulis `.vercel/` dan bisa menarik env ke `.env.local`; keduanya sudah di `.gitignore`. Untuk mencoba dari Vite dengan hot reload: `API_PROXY=http://localhost:3000 pnpm dev`.

Test handler tanpa jaringan: panggil handler dengan `Request` buatan, dan ganti `fetch` ke Resend, Upstash, dan GitHub dengan tiruan (`vi.stubGlobal('fetch', …)`). Validasi jawaban dengan skema dari `docs/api/openapi.yaml` (contohnya di `apps/web/test/kontrak.test.ts`).

## CI

Workflow `Backend` (`.github/workflows/backend.yml`) jalan di setiap PR dan push ke `main`, tanpa filter `paths` supaya aman dijadikan required check: `lint`, `typecheck`, `test` package `@wingmanclutch/api`, dan `npx @redocly/cli@1 lint docs/api/openapi.yaml` dengan aturan di `redocly.yaml`. Setelah stabil, tambahkan job `backend` ke required checks `main`. Jangan pasang filter `paths` lagi setelah itu, karena PR yang tidak memicu workflow akan menunggu check-nya selamanya.

## Checklist

### Rilis 1

- [x] Putuskan penyimpanan batas kirim dan pengirim email (tabel di atas), tulis keputusannya di PR
- [x] `api/` sebagai package `@wingmanclutch/api` dengan TypeScript, Vitest, dan typecheck
- [x] `POST /api/kontak`: metode, content type, ukuran body, JSON, jebakan bot, validasi kolom
- [x] Batas kirim 5 per jam per jaringan dengan IP di-hash, `429` dan `Retry-After`
- [x] Kirim email lewat Resend dengan `reply_to`, `503` saat gagal atau lewat 8 detik
- [x] `GET /api/proyek`: GitHub dan cek status bersamaan, cache CDN, galat sebagian dan total
- [x] Unit test semua jalur di atas, jawaban divalidasi dengan skema kontrak
- [x] Workflow `Backend` di CI dan lint kontrak dengan Redocly
- [x] Env produksi di Vercel (`RESEND_API_KEY`, `KONTAK_TUJUAN`, `KONTAK_PENGIRIM`, `UPSTASH_*`, `GARAM_IP`, opsional `GITHUB_TOKEN`)
- [x] Cek produksi: pesan uji sampai ke wingmanclutch@gmail.com, kiriman ke-6 dalam satu jam ditolak, statistik tampil di lembar detail
