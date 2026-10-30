import { defineConfig } from 'vite'
// Impor di berkas yang dimuat config ini (mock/api.ts, src/api/kontrak.ts) memakai ekstensi .ts,
// supaya config juga bisa dimuat langsung oleh Node (`configLoader: 'native'`, calon default Vite).
import { mockApi } from './mock/api.ts'

// Mock API menjawab /api di `vite dev`, dan di `vite preview` kalau MOCK_API=1 (dipakai E2E).
// Build produksi tidak pernah membawa mock. Untuk mencoba backend sungguhan di lokal, jalankan
// `vercel dev` dari root repo (lihat docs/backend.md) lalu `API_PROXY=http://localhost:3000 pnpm dev`.
const proxy = process.env.API_PROXY

export default defineConfig(({ command, isPreview }) => {
  const pakaiMock = !proxy && command === 'serve' && (!isPreview || !!process.env.MOCK_API)
  return {
    plugins: pakaiMock ? [mockApi()] : [],
    build: { target: 'es2022' },
    server: { port: 5180, proxy: proxy ? { '/api': proxy } : undefined },
    preview: { port: 4180 },
  }
})
