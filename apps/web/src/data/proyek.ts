// Isi halaman: empat aplikasi Wingman Clutch dan orang-orangnya. Ubah teks di sini, bukan di komponen.

import type { KodeWarna } from '../engine/goresan'

export type IdProyek = 'postpocket' | 'tikoem' | 'gorute' | 'tookthel'
/** gerak diam figur di halaman */
export type Gerak = 'goyang' | 'ayun' | 'melayang' | 'denyut'

export interface Proyek {
  id: IdProyek
  nama: string
  slogan: string
  deskripsi: string
  url: string
  repo: string
  tumpukan: string[]
  peran: string
  warna: KodeWarna
  gerak: Gerak
  /** keterangan fitur di bawah figur, tampil di lembar detail */
  fitur: { judul: string; teks: string }[]
}

export const PROYEK: Proyek[] = [
  {
    id: 'postpocket',
    nama: 'PostPocket',
    slogan: 'Kenangan kecil, dikirim jadi surat.',
    deskripsi:
      'Tulis surat di kartu foil 3D, lalu kirim link-nya lewat WhatsApp. Yang nerima tinggal ketuk buat buka, nggak perlu daftar atau pasang aplikasi.',
    url: 'https://postpocket.vercel.app',
    repo: 'https://github.com/Wingman-Clutch/PostPocket',
    tumpukan: ['Nuxt', 'Supabase', 'Tailwind CSS', 'PWA'],
    peran: 'Kall di frontend, Bintang di backend',
    warna: 'p',
    gerak: 'goyang',
    fitur: [
      {
        judul: 'Kartu foil 3D',
        teks: 'Pilih gambar depan atau pakai foto sendiri, atur bagian yang berkilau, lalu putar kartunya buat lihat hasilnya.',
      },
      {
        judul: 'Pocket',
        teks: 'Satu foto tiap hari masuk ke kantong berstiker. Sebulan penuh bisa diputar di TV jadul.',
      },
      {
        judul: 'Kotak bareng',
        teks: 'Beberapa teman nitip surat buat satu orang, terus kotaknya dibuka barengan di jam yang dipilih.',
      },
    ],
  },
  {
    id: 'gorute',
    nama: 'goRute',
    slogan: 'Naik TransJakarta tanpa nebak-nebak.',
    deskripsi:
      'Cari rute TransJakarta dari pintu ke pintu: jalan ke halte mana, naik koridor apa, turun di mana, dan bayar berapa. Nggak perlu akun.',
    url: 'https://gorute.vercel.app',
    repo: 'https://github.com/Wingman-Clutch/goRute',
    tumpukan: ['React', 'MapLibre', 'GTFS TransJakarta', 'PWA'],
    peran: 'Dipegang Bintang',
    warna: 'b',
    gerak: 'ayun',
    fitur: [
      {
        judul: 'Tiga pilihan rute',
        teks: 'Urutkan dari yang paling cepat, paling murah, atau paling sedikit transit dan jalan kaki.',
      },
      {
        judul: 'Jalan kaki beneran',
        teks: 'Petunjuk jalan kakinya ngikutin gang dan JPO, bukan garis lurus di peta.',
      },
      {
        judul: 'Tarif yang pas',
        teks: 'Rp3.500, Rp2.000 jam 5 sampai 7 pagi, dan satu tiket berlaku tiga jam buat transfer.',
      },
    ],
  },
  {
    id: 'tikoem',
    nama: 'Tikoem',
    slogan: 'Titik kumpul yang adil buat semua.',
    deskripsi:
      'Tiap orang kirim lokasi dan kendaraannya. Tikoem nyariin tempat ketemuan yang waktu tempuhnya paling seimbang, jadi nggak ada yang kejauhan sendiri.',
    url: 'https://tikoem.vercel.app',
    repo: 'https://github.com/Wingman-Clutch/tikoem',
    tumpukan: ['React', 'Convex', 'MapLibre', 'PWA'],
    peran: 'Kall di backend, Bintang di frontend',
    warna: 'r',
    gerak: 'melayang',
    fitur: [
      {
        judul: 'Satu link buat grup',
        teks: 'Bikin room, bagikan link-nya ke grup WhatsApp, lalu tiap orang isi lokasinya.',
      },
      {
        judul: 'Adil, bukan cuma di tengah',
        teks: 'Yang dicari tempat dengan perjalanan terlama paling singkat. Motor, mobil, KRL, dan TransJakarta ikut dihitung.',
      },
      {
        judul: 'Hilang dalam sehari',
        teks: 'Nama dan lokasi di room dihapus otomatis 24 jam setelah room dibuat.',
      },
    ],
  },
  {
    id: 'tookthel',
    nama: 'Tookthel',
    slogan: 'Jadi tumbal boleh, rugi jangan.',
    deskripsi:
      'Yang bayarin dulu di kasir jangan sampai tekor. Masukin siapa makan apa, nanti pajak, service, dan diskonnya dibagi per orang, terus struknya tinggal dikirim ke grup.',
    url: 'https://tookthel.vercel.app',
    repo: 'https://github.com/Wingman-Clutch/tookthel',
    tumpukan: ['React', 'Vite', 'Tailwind CSS', 'PWA'],
    peran: 'Dipegang Bintang',
    warna: 'g',
    gerak: 'denyut',
    fitur: [
      {
        judul: 'Menu bisa dibagi',
        teks: 'Satu piring dimakan bertiga? Harganya dibagi rata ke yang ikut makan.',
      },
      {
        judul: 'Sama kayak struk',
        teks: 'Pajak, service, dan diskon bisa persen atau nominal, urutan hitungnya ngikutin struk restoran.',
      },
      {
        judul: 'Struk buat grup',
        teks: 'Hasilnya dicetak jadi struk. Rekening atau e-wallet si tumbal ikut tercantum, jadi teman bisa langsung transfer.',
      },
    ],
  },
]

export const STUDIO = {
  nama: 'Wingman Clutch',
  tagline: 'Two is enough to win.',
  email: 'wingmanclutch@gmail.com',
  tautan: [
    ['GitHub', 'https://github.com/Wingman-Clutch'],
    ['Traktir kopi', 'https://sociabuzz.com/wingmanclutch/tribe'],
  ] as [string, string][],
}

export interface Anggota {
  nama: string
  panggilan: string
  peran: string
  github: string
  /** foto persegi di public/tim/, digambar ulang jadi sketsa pensil */
  foto?: string
}

export const TIM: Anggota[] = [
  {
    nama: 'Muhammad Haikal Faruq',
    panggilan: 'Kall',
    peran: 'Frontend dan desain',
    github: 'https://github.com/HaikalFaruq',
    foto: '/tim/kall.jpg',
  },
  {
    nama: 'Bintang Fabian Putra',
    panggilan: 'Bintang',
    peran: 'Backend dan data',
    github: 'https://github.com/bintangfabian',
    foto: '/tim/bintang.jpg',
  },
]
