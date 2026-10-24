import { act } from '@testing-library/react'
import type { Bar, Engine, EngineStart, Mix, Sound } from '@/audio/engine'

/** Motor para los tests de UI: avanza golpe por golpe y registra lo que se le pide tocar. */
export function createFakeEngine() {
  let options: EngineStart | undefined
  // lo que recibió el último start, aunque ya haya habido stop: el motor real lo conserva mientras espera a Tone.start()
  let lastStart: EngineStart | undefined
  let bpm: number | undefined
  let mix: Mix | undefined
  let bar = 0
  let beat = 0
  let plan: Bar | undefined
  // barAt ya se pidió para el compás que sigue (askAhead)
  let planned = false
  const played: { bar: number; beat: number; sound: Sound }[] = []
  const bars: Bar[] = []

  const engine = {
    start: async (startOptions) => {
      options = startOptions
      lastStart = startOptions
      bpm = startOptions.bpm
      mix = startOptions.mix
      bar = 0
      beat = 0
      planned = false
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

  // pide el compás que sigue y lo deja en plan; undefined es el fin
  function request() {
    plan = options!.barAt(bar)
    planned = true
    if (plan) bars.push(plan)
  }

  return {
    engine,
    played,
    /** Los compases que devolvió barAt, en orden: bars[0] es la cuenta de entrada. */
    bars,
    get lastStart() {
      return lastStart
    },
    get bpm() {
      return bpm
    },
    get mix() {
      return mix
    },
    get running() {
      return options !== undefined
    },
    /** Pide ya el compás que sigue, como el motor real con su anticipación; el próximo beat() no lo vuelve a pedir. */
    askAhead() {
      act(() => {
        if (options && beat === 0 && !planned) request()
      })
    },
    /** Avanza n golpes: pide el compás al empezarlo, registra lo que suena y avisa a la UI, como el motor real. */
    beat(n = 1) {
      act(() => {
        for (let i = 0; i < n && options; i++) {
          if (beat === 0) {
            if (!planned) request()
            if (!plan) {
              // como el motor real: avisa del fin y no avanza más
              const { onEnd } = options
              options = undefined
              onEnd()
              break
            }
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
            planned = false
          }
        }
      })
    }
  }
}
