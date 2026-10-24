import { act } from '@testing-library/react'
import type { Bar, Engine, EngineStart, Sound } from '@/audio/engine'

/** Motor para los tests de UI: avanza golpe por golpe y registra lo que se le pide tocar. */
export function createFakeEngine() {
  let options: EngineStart | undefined
  let bpm: number | undefined
  let bar = 0
  let beat = 0
  let plan: Bar | undefined
  const played: { bar: number; beat: number; sound: Sound }[] = []

  const engine = {
    start: async (startOptions) => {
      options = startOptions
      bpm = startOptions.bpm
      bar = 0
      beat = 0
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
    /** Avanza n golpes: pide el compás al empezarlo, registra lo que suena y avisa a la UI, como el motor real. */
    beat(n = 1) {
      act(() => {
        for (let i = 0; i < n && options; i++) {
          if (beat === 0) plan = options.barAt(bar)
          for (const event of plan!.events) {
            if (event.at >= beat && event.at < beat + 1) {
              played.push({ bar, beat: event.at, sound: event.sound })
            }
          }
          options.onBeat(bar, beat)
          beat++
          if (beat === plan!.beats) {
            bar++
            beat = 0
          }
        }
      })
    }
  }
}
