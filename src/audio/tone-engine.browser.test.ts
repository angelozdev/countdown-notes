import * as Tone from 'tone'
import { expect, test } from 'vitest'
import type { Engine, EngineStart } from './engine'
import { createToneEngine } from './tone-engine'

type During = (engine: Engine, context: Tone.OfflineContext) => void

function renderPractice(
  bpm: number,
  soundsAt: EngineStart['soundsAt'],
  seconds: number,
  during?: During
) {
  return Tone.Offline(async (context) => {
    // sin anticipación, Offline cuantiza los eventos a bloques de 128 muestras
    context.lookAhead = 0.1
    const engine = createToneEngine()
    await engine.start({ bpm, beatsPerBar: 4, soundsAt, onBeat: () => {} })
    during?.(engine, context)
  }, seconds)
}

function onsets(
  buffer: Tone.ToneAudioBuffer,
  threshold: number,
  minGap: number
) {
  const data = buffer.getChannelData(0)
  const rate = buffer.sampleRate
  const found: { time: number; peak: number }[] = []
  let lastLoud = -Infinity
  for (let i = 0; i < data.length; i++) {
    if (Math.abs(data[i]) <= threshold) continue
    if (i / rate - lastLoud >= minGap) {
      const end = Math.min(data.length, i + Math.round(0.03 * rate))
      let peak = 0
      for (let j = i; j < end; j++) peak = Math.max(peak, Math.abs(data[j]))
      found.push({ time: i / rate, peak })
    }
    lastLoud = i / rate
  }
  return found
}

const clicks: EngineStart['soundsAt'] = (_bar, beat) => [
  { kind: 'click', accent: beat === 0 }
]

test.each([30, 60, 200, 240])(
  'a %i BPM, cada golpe cae en su tiempo',
  async (bpm) => {
    const beat = 60 / bpm
    const found = onsets(
      await renderPractice(bpm, clicks, 7.5 * beat),
      1e-3,
      0.1
    )
    expect(found).toHaveLength(8)
    expect(found[0].time).toBeLessThan(0.12)
    for (const [k, { time }] of found.entries()) {
      expect(Math.abs(time - (found[0].time + k * beat))).toBeLessThan(0.001)
    }
  }
)

test('el tiempo 1 suena más fuerte que los demás', async () => {
  const peaks = onsets(await renderPractice(120, clicks, 3.75), 1e-3, 0.1).map(
    (onset) => onset.peak
  )
  expect(peaks).toHaveLength(8)
  const weakest = Math.min(peaks[0], peaks[4])
  for (const k of [1, 2, 3, 5, 6, 7]) {
    expect(weakest).toBeGreaterThan(1.5 * peaks[k])
  }
})

test('stop calla todo de inmediato', async () => {
  const buffer = await renderPractice(60, clicks, 4, (engine, context) => {
    context.setTimeout(() => engine.stop(), 1.5)
  })
  expect(onsets(buffer, 1e-3, 0.1)).toHaveLength(2)
  const afterStop = buffer
    .getChannelData(0)
    .slice(Math.round(1.6 * buffer.sampleRate))
  expect(afterStop.every((sample) => Math.abs(sample) <= 1e-3)).toBe(true)
})

test('un cambio de BPM no duplica ni salta golpes', async () => {
  const buffer = await renderPractice(60, clicks, 10, (engine, context) => {
    context.setTimeout(() => engine.setBpm(120), 3.5)
  })
  const times = onsets(buffer, 1e-3, 0.1).map((onset) => onset.time)
  const gaps = times.slice(1).map((time, k) => time - times[k])
  for (const gap of gaps.slice(0, 3))
    expect(Math.abs(gap - 1)).toBeLessThan(0.001)
  for (const gap of gaps.slice(-4))
    expect(Math.abs(gap - 0.5)).toBeLessThan(0.001)
  for (const gap of gaps) {
    expect(gap).toBeGreaterThan(0.499)
    expect(gap).toBeLessThan(1.001)
  }
})

test('el bajo ataca en el tiempo 1 de su compás', async () => {
  // un compás sí y otro no, para que haya silencio antes de cada ataque
  const buffer = await renderPractice(
    60,
    (bar, beat) => [
      ...(bar === 0 && beat === 0
        ? [{ kind: 'click', accent: true } as const]
        : []),
      ...(beat === 0 && bar % 2 === 1
        ? [{ kind: 'bass', pitch: 'Bb2' } as const]
        : [])
    ],
    14
  )
  const times = onsets(buffer, 1e-5, 1).map((onset) => onset.time)
  expect(times).toHaveLength(3)
  expect(Math.abs(times[1] - (times[0] + 4))).toBeLessThan(0.001)
  expect(Math.abs(times[2] - (times[0] + 12))).toBeLessThan(0.001)
})
