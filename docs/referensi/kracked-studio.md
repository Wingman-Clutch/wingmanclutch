# Referensi: kracked.studio

Catatan cara kerja [kracked.studio](https://kracked.studio) yang ditiru di rilis 1, dilihat 30 Oktober 2026. Hanya catatan; screenshot dan kode mereka tidak disimpan di repo (AGENTS.md bagian 8).

## Halaman

- Satu layar penuh tanpa scroll. Adegan lanskap 1700 x 1000 satuan, potret 1000 x 2180, dipilih dari rasio layar (potret kalau lebar/tinggi < 0,92). Adegan diskalakan sampai muat, jadi di HP semuanya mengecil.
- Kertas kotak dengan garis setiap 46 satuan, butiran dan serat kertas, satu noda cincin kopi, dan kolom DATE tercetak dengan tanggal hari ini ditulis tangan.
- Semua gambar adalah goresan pensil di canvas: path ditarik bertahap dengan goyangan tangan, garis tepi dua kali, isi berupa arsiran. Setiap gambar punya kanvas sendiri dan selalu tampak sama (benih acak per gambar).
- Urutan menggambar saat dibuka: tanggal, logo (±2,3 detik), lalu empat kategori berurutan, catatan kecil, dan terakhir saklar tema. Semuanya selesai sekitar 3 detik.

## Interaksi

| Elemen | Perilaku |
| --- | --- |
| Logo | Diketuk: logo bergetar dan satu retakan baru digambar (beberapa kali) |
| Empat kategori | Perangkat (konsol, browser, HP, kuda-kuda) yang layarnya bergantian digambar dan dipudarkan. Diketuk: lembar berisi proyek kategori itu |
| Kertas tempel ABOUT US | Dialog kartu: paragraf, tiga langkah bernomor, tombol ke tim dan kontak |
| THE TEAM | Dialog lembar: polaroid foto yang diubah jadi sketsa pensil, nama, peran |
| Kotak LET'S KRACK IT | Dialog kontak: nama, email, pesan, kolom jebakan bot, kirim ke `/api/contact`. Kalau gagal, tautan email berisi pesan yang sama dan tombol salin |
| Bulan / matahari | Tema terang dan gelap, disimpan di localStorage. Di gelap, grafit jadi seperti kapur |
| Sudut kanan atas | Terlipat sedikit. Ditarik melewati batas atau diketuk: halaman terkelupas ke Matrix (hujan karakter hijau), dan sebaliknya |
| Lima pensil | Mode corat-coret di seluruh halaman dengan warna pensil itu; bar bawah dengan tombol selesai; Escape keluar |
| Penghapus | Diangkat dari baki, menggosok zig-zag seluruh layar (menghapus gambar dan coretan, meninggalkan bekas abu-abu dan remah), lalu semua digambar ulang |
| Gerak dikurangi | Semua langsung tergambar tanpa animasi |

## Yang kami ubah

- Isi seluruhnya milik Wingman Clutch dan berbahasa Indonesia.
- Empat kategori menjadi empat aplikasi, dan lembar detailnya menampilkan tiga fitur bergambar per aplikasi, bukan daftar proyek.
- Logo tidak retak tetapi mengepakkan sayap, sesuai lambang Wingman Clutch.
- Ditambah `GET /api/proyek` untuk statistik hidup di lembar detail.
