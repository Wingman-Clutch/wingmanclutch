import { defineConfig, devices } from '@playwright/test'

// Smoke test ke produksi: halaman dan backend sungguhan, tanpa build lokal dan tanpa mock API.
// Alamatnya dari PRODUKSI_URL, bawaannya domain produksi. Tidak ada test yang mengirim email.
export default defineConfig({
  testDir: 'e2e-produksi',
  fullyParallel: true,
  workers: 2,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: process.env.PRODUKSI_URL ?? 'https://wingmanclutch.web.id',
    trace: 'retain-on-failure',
  },
  projects: [
    // API cukup dicek sekali, halamannya di dua mesin browser
    { name: 'api', testMatch: 'api.spec.ts' },
    {
      name: 'desktop',
      testMatch: 'halaman.spec.ts',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    { name: 'iphone', testMatch: 'halaman.spec.ts', use: { ...devices['iPhone 15'] } },
  ],
})
