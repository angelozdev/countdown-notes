import { act } from '@testing-library/react'
import type { Engine, EngineStart, Sound } from '@/audio/engine'

/** Motor para los tests de UI: avanza tiempo por tiempo y registra lo que se le pide tocar. */
export function createFakeEngine() {
  let options: EngineStart | undefined
  let bpm: number | undefined
  let next = 0
  const played: { bar: number; beat: number; sound: Sound }[] = []

  const engine = {
    start: async (startOptions) => {
      options = startOptions
      bpm = startOptions.bpm
      next = 0
    },
    stop: () => {
      options = undefined
    },
    setBpm: (newBpm) => {
      bpm = newBpm
    }
  } satisfies Engine

  return {
    engine,
    played,
    get bpm() {
      return bpm
    },
    get running() {
      return options !== undefined
    },
    /** Avanza n tiempos: para cada uno pide lo que suena y avisa a la UI, como el motor real. */
    beat(n = 1) {
      act(() => {
        for (let i = 0; i < n && options; i++) {
          const bar = Math.floor(next / options.beatsPerBar)
          const beat = next % options.beatsPerBar
          next++
          for (const sound of options.soundsAt(bar, beat)) {
            played.push({ bar, beat, sound })
          }
          options.onBeat(bar, beat)
        }
      })
    }
  }
}
