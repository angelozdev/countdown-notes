import * as Tone from 'tone'
import { expect, test, vi } from 'vitest'
import { createToneEngine } from '@/audio/tone-engine'
import { createPracticeStore, type PracticeState } from './store'

/** Toca con el store y el motor real dentro de Tone.Offline y devuelve las llamadas a los sintetizadores. */
async function renderStore(
  setup: (state: PracticeState) => void,
  seconds: number
) {
  const spies = {
    click: vi.spyOn(Tone.Synth.prototype, 'triggerAttackRelease'),
    bass: vi.spyOn(Tone.MonoSynth.prototype, 'triggerAttackRelease'),
    chord: vi.spyOn(Tone.PolySynth.prototype, 'triggerAttackRelease')
  }
  try {
    await Tone.Offline(async (context) => {
      // sin anticipación, Offline cuantiza los eventos a bloques de 128 muestras
      context.lookAhead = 0.1
      localStorage.clear()
      const real = createToneEngine()
      // play no espera a start: el test sí, para que la cadena exista antes de renderizar
      let started: Promise<void> = Promise.resolve()
      const store = createPracticeStore({
        ...real,
        start: (options) => (started = real.start(options))
      })
      setup(store.getState())
      store.getState().play()
      await started
    }, seconds)
    return {
      click: spies.click.mock.calls,
      bass: spies.bass.mock.calls,
      chord: spies.chord.mock.calls
    }
  } finally {
    for (const spy of Object.values(spies)) spy.mockRestore()
  }
}

test('cada cambio de acorde del ii–V–I cae en su compás', async () => {
  // a 240 BPM en 4/4, un compás dura 1 s
  const { click, bass, chord } = await renderStore((state) => {
    state.setMode('progression')
    state.setWithChord(true)
    state.setRepeats({ on: true, count: 2 })
    state.setBpm(240)
  }, 10)

  // el primer click es el de la cuenta de entrada: el compás k empieza en t0 + k
  const t0 = click[0][2] as number
  const pitches = ['D2', 'G2', 'C2', 'C2', 'D2', 'G2', 'C2', 'C2']
  expect(bass).toHaveLength(8)
  expect(chord).toHaveLength(8)
  for (const k of pitches.keys()) {
    expect(bass[k][0]).toBe(pitches[k])
    expect(Math.abs((bass[k][2] as number) - (t0 + 1 + k))).toBeLessThan(0.001)
    expect(Math.abs((chord[k][2] as number) - (t0 + 1 + k))).toBeLessThan(0.001)
  }
})

// un golpe dura 0,25 s a 240 BPM; el turnaround es Cmaj7 A7 | Dm7 G7
test.each([
  { meter: '4/4', countIn: 4, ats: [0, 2, 4, 6], lengths: [2, 2, 2, 2] },
  { meter: '3/4', countIn: 3, ats: [0, 2, 3, 5], lengths: [2, 1, 2, 1] }
] as const)(
  'en $meter, el cambio de mitad de compás cae a tiempo',
  async ({ meter, countIn, ats, lengths }) => {
    const { click, bass, chord } = await renderStore((state) => {
      state.setMode('progression')
      state.setProgression('turnaround')
      state.setMeter(meter)
      state.setWithChord(true)
      state.setRepeats({ on: true, count: 1 })
      state.setBpm(240)
    }, 6)

    const t0 = click[0][2] as number
    const beat = 0.25
    expect(bass.map((call) => call[0])).toEqual(['C2', 'A2', 'D2', 'G2'])
    expect(chord).toHaveLength(4)
    for (const k of ats.keys()) {
      const time = t0 + (countIn + ats[k]) * beat
      expect(Math.abs((bass[k][2] as number) - time)).toBeLessThan(0.001)
      expect(Math.abs((chord[k][2] as number) - time)).toBeLessThan(0.001)
      // 90 % de su largo
      expect(
        Math.abs((chord[k][1] as number) - 0.9 * lengths[k] * beat)
      ).toBeLessThan(0.002)
    }
  }
)
