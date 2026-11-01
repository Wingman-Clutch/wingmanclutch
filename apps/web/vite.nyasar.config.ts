import { defineConfig } from 'vite'

// Halaman 404 dibangun sendiri, setelah halaman utama. Stiker dan mesin pensilnya masuk folder
// nyasar/, jadi bundle halaman utama tidak terpecah dan anggaran JS-nya tidak ikut terpakai.
export default defineConfig({
  publicDir: false,
  build: {
    target: 'es2022',
    emptyOutDir: false,
    assetsDir: 'nyasar',
    rolldownOptions: { input: '404.html', output: { comments: { legal: true } } },
  },
})
