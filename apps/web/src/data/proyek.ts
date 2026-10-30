// Isi halaman: empat aplikasi Wingman Clutch dan orang-orangnya. Ubah teks di sini, bukan di komponen.

import type { KodeWarna, Op } from '../engine/goresan'
import { gorute, layarGorute } from '../sketsa/gorute'
import { layarPostpocket, postpocket } from '../sketsa/postpocket'
import { layarTikoem, tikoem } from '../sketsa/tikoem'
import { layarTookthel, tookthel } from '../sketsa/tookthel'

export type IdProyek = 'postpocket' | 'tikoem' | 'gorute' | 'tookthel'
/** gerak diam sketsa di halaman */
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
  gambar: (denganLabel?: boolean) => Op[]
  layar: (() => Op[])[]
  /** satu keterangan untuk setiap layar, tampil di lembar detail */
  fitur: { judul: string; teks: string }[]
}

export const PROYEK: Proyek[] = [
  {
    id: 'postpocket',
    nama: 'PostPocket',
    slogan: 'Kenangan kecil, dikirim jadi surat.',
    deskripsi:
      'Tulis kartu foil 3D, simpan satu momen setiap hari, dan foto bareng di booth. Semua dibuka lewat satu link, tanpa daftar dan tanpa aplikasi.',
    url: 'https://postpocket.vercel.app',
    repo: 'https://github.com/Wingman-Clutch/PostPocket',
    tumpukan: ['Nuxt', 'Supabase', 'Tailwind CSS', 'PWA'],
    peran: 'Kall di frontend, Bintang di backend',
    warna: 'p',
    gerak: 'goyang',
    gambar: postpocket,
    layar: layarPostpocket,
    fitur: [
      {
        judul: 'Surat foil 3D',
        teks: 'Kartu bercetak foil yang bisa diputar, dibuka, dan dibaca seperti surat sungguhan.',
      },
      {
        judul: 'Pocket',
        teks: 'Kalender bulanan: setiap hari diisi foto lalu dibungkus kantong berstiker.',
      },
      {
        judul: 'Booth',
        teks: 'Photobooth di browser yang menghasilkan strip foto untuk disimpan.',
      },
    ],
  },
  {
    id: 'gorute',
    nama: 'goRute',
    slogan: 'Naik TransJakarta tanpa nebak-nebak.',
    deskripsi:
      'Rute transportasi umum Jabodetabek dari pintu ke pintu: jalan kaki, halte, transit, tarif, dan jamnya. PWA, tanpa akun.',
    url: 'https://gorute.vercel.app',
    repo: 'https://github.com/Wingman-Clutch/goRute',
    tumpukan: ['React', 'MapLibre', 'GTFS TransJakarta', 'PWA'],
    peran: 'Dipegang Bintang',
    warna: 'b',
    gerak: 'ayun',
    gambar: gorute,
    layar: layarGorute,
    fitur: [
      {
        judul: 'Jalur dan transit',
        teks: 'Koridor yang dilewati, halte transit, dan urutan haltenya.',
      },
      {
        judul: 'Jadwal berangkat',
        teks: 'Bus berikutnya di halte terdekat, lengkap dengan perkiraan menitnya.',
      },
      { judul: 'Pintu ke pintu', teks: 'Jalan kaki, naik bus, jalan lagi, plus tarif totalnya.' },
    ],
  },
  {
    id: 'tikoem',
    nama: 'Tikoem',
    slogan: 'Titik kumpul yang adil buat semua.',
    deskripsi:
      'Tiap orang kirim lokasinya, Tikoem carikan tempat ketemuan yang waktu tempuhnya paling seimbang. Naik motor, mobil, atau transportasi umum.',
    url: 'https://tikoem.vercel.app',
    repo: 'https://github.com/Wingman-Clutch/tikoem',
    tumpukan: ['React', 'Convex', 'MapLibre', 'PWA'],
    peran: 'Kall di backend, Bintang di frontend',
    warna: 'r',
    gerak: 'melayang',
    gambar: tikoem,
    layar: layarTikoem,
    fitur: [
      {
        judul: 'Lokasi semua teman',
        teks: 'Setiap orang membagikan lokasinya lewat satu link room.',
      },
      {
        judul: 'Tempat yang adil',
        teks: 'Kandidat tempat diurutkan dari waktu tempuh yang paling seimbang.',
      },
      { judul: 'Fix, berangkat', teks: 'Tetapkan tempat dan jamnya, lalu bagikan ke grup.' },
    ],
  },
  {
    id: 'tookthel',
    nama: 'Tookthel',
    slogan: 'Jadi tumbal boleh, rugi jangan.',
    deskripsi:
      'Bagi tagihan nongkrong lengkap dengan pajak, service, dan diskon, lalu kirim struknya ke grup.',
    url: 'https://tookthel.vercel.app',
    repo: 'https://github.com/Wingman-Clutch/tookthel',
    tumpukan: ['React', 'Vite', 'Tailwind CSS', 'PWA'],
    peran: 'Dipegang Bintang',
    warna: 'g',
    gerak: 'denyut',
    gambar: tookthel,
    layar: layarTookthel,
    fitur: [
      {
        judul: 'Struk lengkap',
        teks: 'Pesanan, pajak, dan service dihitung persis seperti di kasir.',
      },
      {
        judul: 'Bagian tiap orang',
        teks: 'Setiap orang tahu harus bayar berapa, sampai ke perak terakhir.',
      },
      { judul: 'Lunas', teks: 'Tandai yang sudah bayar, lalu kirim struknya ke grup.' },
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
    peran: 'Frontend, desain, ilustrasi',
    github: 'https://github.com/HaikalFaruq',
    foto: '/tim/kall.jpg',
  },
  {
    nama: 'Bintang Fabian Putra',
    panggilan: 'Bintang',
    peran: 'Backend, keamanan, data',
    github: 'https://github.com/bintangfabian',
    foto: '/tim/bintang.jpg',
  },
]
