import { createContext, useContext } from 'react'
import { useStore } from 'zustand'
import { createStore } from 'zustand/vanilla'
import type { Engine, Sound } from '@/audio/engine'

export type Status = 'stopped' | 'countIn' | 'playing'

export type PracticeState = {
  status: Status
  /** Lo que está sonando: el compás 0 es la cuenta de entrada. */
  position: { bar: number; beat: number } | null
  bpm: number
  play: () => void
  stop: () => void
  setBpm: (bpm: number) => void
}

export type PracticeStore = ReturnType<typeof createPracticeStore>

export function createPracticeStore(engine: Engine) {
  return createStore<PracticeState>()((set, get) => {
    function soundsAt(_bar: number, beat: number): Sound[] {
      return [{ kind: 'click', accent: beat === 0 }]
    }

    function onBeat(bar: number, beat: number) {
      set({
        position: { bar, beat },
        status: bar === 0 ? 'countIn' : 'playing'
      })
    }

    return {
      status: 'stopped',
      position: null,
      bpm: 60,
      play() {
        if (get().status !== 'stopped') return
        set({ status: 'countIn', position: null })
        engine
          .start({ bpm: get().bpm, beatsPerBar: 4, soundsAt, onBeat })
          .catch(() => get().stop())
      },
      stop() {
        engine.stop()
        set({ status: 'stopped', position: null })
      },
      setBpm(bpm) {
        const next = Math.min(240, Math.max(30, Math.round(bpm)))
        set({ bpm: next })
        if (get().status !== 'stopped') engine.setBpm(next)
      }
    }
  })
}

export const PracticeContext = createContext<PracticeStore | null>(null)

export function usePractice<T>(selector: (state: PracticeState) => T): T {
  const store = useContext(PracticeContext)
  if (!store) throw new Error('usePractice necesita un PracticeContext')
  return useStore(store, selector)
}
