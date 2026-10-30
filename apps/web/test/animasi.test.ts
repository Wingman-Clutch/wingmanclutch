import { afterEach, describe, expect, it, vi } from 'vitest'
import { cicil } from '../src/engine/animasi'

afterEach(() => {
  vi.useRealTimers()
})

describe('cicil', () => {
  it('menjalankan kerja berurutan di tugas-tugas berikutnya, dipotong per anggaran waktu', () => {
    vi.useFakeTimers()
    let jam = 0
    const jalan: number[] = []
    const kerja = [5, 5, 5, 20, 1, 1].map((ms, i) => () => {
      jalan.push(i)
      jam += ms
    })
    cicil(kerja, 8, () => jam)
    // tugas pemanggil (pembuka halaman) tidak ikut memikul kerjanya
    expect(jalan).toEqual([])
    vi.advanceTimersToNextTimer()
    expect(jalan).toEqual([0, 1])
    // satu kerja yang lebih lama dari anggaran tetap jalan utuh, lalu tugasnya berhenti
    vi.advanceTimersToNextTimer()
    expect(jalan).toEqual([0, 1, 2, 3])
    vi.advanceTimersToNextTimer()
    expect(jalan).toEqual([0, 1, 2, 3, 4, 5])
    expect(vi.getTimerCount()).toBe(0)
  })

  it('tidak menjadwalkan apa pun kalau tidak ada kerja', () => {
    vi.useFakeTimers()
    cicil([])
    expect(vi.getTimerCount()).toBe(0)
  })
})
