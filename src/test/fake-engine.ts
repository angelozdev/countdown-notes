import { act } from '@testing-library/react'
import type { Bar, Engine, EngineStart, Mix, Sound } from '@/audio/engine'

/** Motor para los tests de UI: avanza golpe por golpe y registra lo que se le pide tocar. */
export function createFakeEngine() {
  let options: EngineStart | undefined
  let bpm: number | undefined
  let mix: Mix | undefined
  let bar = 0
  let beat = 0
  let plan: Bar | undefined
  const played: { bar: number; beat: number; sound: Sound }[] = []
  const bars: Bar[] = []

  const engine = {
    start: async (startOptions) => {
      options = startOptions
      bpm = startOptions.bpm
      mix = startOptions.mix
      bar = 0
      beat = 0
    },
    stop: () => {
      options = undefined
    },
    setBpm: (newBpm) => {
      bpm = newBpm
    },
    setMix: (newMix) => {
      mix = newMix
    }
  } satisfies Engine

  return {
    engine,
    played,
    /** Los compases que devolvió barAt, en orden: bars[0] es la cuenta de entrada. */
    bars,
    get bpm() {
      return bpm
    },
    get mix() {
      return mix
    },
    get running() {
      return options !== undefined
    },
    /** Avanza n golpes: pide el compás al empezarlo, registra lo que suena y avisa a la UI, como el motor real. */
    beat(n = 1) {
      act(() => {
        for (let i = 0; i < n && options; i++) {
          if (beat === 0) {
            const next = options.barAt(bar)
            if (!next) {
              // como el motor real: avisa del fin y no avanza más
              const { onEnd } = options
              options = undefined
              onEnd()
              break
            }
            plan = next
            bars.push(plan)
          }
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
