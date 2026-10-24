import * as Tone from 'tone'
import { expect, test } from 'vitest'
import { userEvent } from 'vitest/browser'
import { accentAt, METERS, type Meter } from '@/music/meters'
import type { Bar, Engine, EngineStart, Mix } from './engine'
import { createToneEngine } from './tone-engine'

type During = (engine: Engine, context: Tone.OfflineContext) => void

// la mezcla de la entrega 1: los dos canales en 80, sin silenciar
const MIX: Mix = {
  click: { volume: 80, muted: false },
  bass: { volume: 80, muted: false }
}

function renderPractice(
  bpm: number,
  barAt: EngineStart['barAt'],
  seconds: number,
  during?: During,
  mix: Mix = MIX
) {
  return Tone.Offline(async (context) => {
    // sin anticipación, Offline cuantiza los eventos a bloques de 128 muestras
    context.lookAhead = 0.1
    const engine = createToneEngine()
    await engine.start({ bpm, mix, barAt, onBeat: () => {}, onEnd: () => {} })
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

const clickEvents = [0, 1, 2, 3].map((at) => ({
  at,
  sound: { kind: 'click', accent: at === 0 ? 'strong' : 'none' } as const
}))

const clicks: EngineStart['barAt'] = () => ({
  beats: 4,
  beatLength: 1,
  events: clickEvents
})

// un click por golpe, con el acento que le toca en el compás
const barOf = (meter: Meter) => (): Bar => ({
  beats: meter.beats,
  beatLength: meter.beatLength,
  events: Array.from({ length: meter.beats }, (_, at) => ({
    at,
    sound: { kind: 'click', accent: accentAt(meter, at) }
  }))
})

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

test.each(METERS)('en $id, cada golpe cae en su tiempo', async (meter) => {
  // a 60 BPM, un golpe dura beatLength segundos
  const { beats, beatLength } = meter
  const found = onsets(
    await renderPractice(60, barOf(meter), (2 * beats - 0.5) * beatLength),
    1e-3,
    0.1
  )
  expect(found).toHaveLength(2 * beats)
  for (const [k, { time }] of found.entries()) {
    expect(Math.abs(time - (found[0].time + k * beatLength))).toBeLessThan(
      0.001
    )
  }
})

test('en 12/8 a 240 BPM, los golpes caen cada 83 ms', async () => {
  const meter = METERS.find(({ id }) => id === '12/8')!
  const beat = (meter.beatLength * 60) / 240
  const found = onsets(
    await renderPractice(240, barOf(meter), (3 * meter.beats - 0.5) * beat),
    1e-3,
    0.02
  )
  expect(found).toHaveLength(3 * meter.beats)
  for (const [k, { time }] of found.entries()) {
    expect(Math.abs(time - (found[0].time + k * beat))).toBeLessThan(0.001)
  }
})

test('el acento fuerte suena más que el suave, y el suave más que el sin acento', async () => {
  const meter = METERS.find(({ id }) => id === '6/8')!
  const peaks = onsets(
    await renderPractice(
      60,
      barOf(meter),
      (meter.beats - 0.5) * meter.beatLength
    ),
    1e-3,
    0.1
  ).map((onset) => onset.peak)
  expect(peaks).toHaveLength(6)
  expect(peaks[0]).toBeGreaterThan(1.1 * peaks[3])
  expect(peaks[3]).toBeGreaterThan(
    1.1 * Math.max(peaks[1], peaks[2], peaks[4], peaks[5])
  )
})

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

// tiempo real, sin Offline: Draw avisa de cada golpe con unos 0,1 s de anticipación, y es lo que
// debe quedar cancelado al parar. Los timers de aquí solo esperan, no marcan tiempo musical
test('después de stop no se llama a ningún onBeat', async () => {
  const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
  // el audio solo se desbloquea dentro de un toque, como el de Play en la app
  const unlock = document.body.appendChild(document.createElement('button'))
  unlock.addEventListener('click', () => void Tone.start())
  await userEvent.click(unlock)
  unlock.remove()

  const engine = createToneEngine()
  const late: number[] = []
  // el golpe siguiente cae 0,25 s después del primero; parar en distintos momentos de los
  // últimos 0,1 s, cuando su aviso ya está en cola
  for (const stopAfter of [0.17, 0.185, 0.2, 0.215, 0.23]) {
    let calls = 0
    let firstBeatAt = 0
    await engine.start({
      bpm: 240,
      mix: MIX,
      barAt: clicks,
      onBeat: () => {
        if (++calls === 1) firstBeatAt = Tone.getContext().currentTime
      },
      onEnd: () => {}
    })
    while (calls === 0) await wait(2)
    while (Tone.getContext().currentTime < firstBeatAt + stopAfter)
      await wait(2)
    engine.stop()
    const atStop = calls
    await wait(350)
    late.push(calls - atStop)
  }
  expect(late).toEqual([0, 0, 0, 0, 0])
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
    (bar) => ({
      beats: 4,
      beatLength: 1,
      events:
        bar === 0
          ? [{ at: 0, sound: { kind: 'click', accent: 'strong' } }]
          : bar % 2 === 1
            ? [{ at: 0, sound: { kind: 'bass', pitch: 'Bb2', length: 4 } }]
            : []
    }),
    14
  )
  const times = onsets(buffer, 1e-5, 1).map((onset) => onset.time)
  expect(times).toHaveLength(3)
  expect(Math.abs(times[1] - (times[0] + 4))).toBeLessThan(0.001)
  expect(Math.abs(times[2] - (times[0] + 12))).toBeLessThan(0.001)
})

test('el bajo ataca a mitad de golpe y dura lo que dice length', async () => {
  const buffer = await renderPractice(
    60,
    (bar): Bar => ({
      beats: 4,
      beatLength: 1,
      events:
        bar === 0
          ? [{ at: 0, sound: { kind: 'click', accent: 'strong' } }]
          : bar === 1
            ? [{ at: 1.5, sound: { kind: 'bass', pitch: 'Bb2', length: 0.5 } }]
            : []
    }),
    10
  )
  const times = onsets(buffer, 1e-5, 1).map((onset) => onset.time)
  expect(times).toHaveLength(2)
  expect(Math.abs(times[1] - (times[0] + 5.5))).toBeLessThan(0.001)
  // 0,45 s de nota (90 % de 0,5 golpes) + 0,3 s de release + margen
  const silentFrom = times[0] + 5.5 + 0.45 + 0.3 + 0.2
  const after = buffer
    .getChannelData(0)
    .slice(Math.round(silentFrom * buffer.sampleRate))
  expect(after.every((sample) => Math.abs(sample) <= 1e-3)).toBe(true)
})

test('un canal silenciado no suena', async () => {
  // la cuenta (compás 0) suena; desde el compás 1 solo hay un bajo, silenciado
  const buffer = await renderPractice(
    60,
    (bar): Bar =>
      bar === 0
        ? { beats: 4, beatLength: 1, countIn: true, events: clickEvents }
        : {
            beats: 4,
            beatLength: 1,
            events: [
              { at: 0, sound: { kind: 'bass', pitch: 'Bb2', length: 4 } }
            ]
          },
    8,
    undefined,
    { ...MIX, bass: { volume: 80, muted: true } }
  )
  expect(onsets(buffer, 1e-3, 0.1)).toHaveLength(4)
  const after = buffer
    .getChannelData(0)
    .slice(Math.round(3.9 * buffer.sampleRate))
  expect(after.every((sample) => Math.abs(sample) <= 1e-4)).toBe(true)
})

test('la cuenta de entrada suena con el metrónomo silenciado, y después no', async () => {
  const buffer = await renderPractice(
    60,
    (bar): Bar => ({
      beats: 4,
      beatLength: 1,
      countIn: bar === 0,
      events: clickEvents
    }),
    8,
    undefined,
    { ...MIX, click: { volume: 80, muted: true } }
  )
  const found = onsets(buffer, 1e-3, 0.1)
  expect(found).toHaveLength(4)
  expect(found.every(({ time }) => time < 4)).toBe(true)
})

test('el volumen cambia de inmediato', async () => {
  // todos con el mismo acento, para que solo cambie el volumen
  const even: EngineStart['barAt'] = () => ({
    beats: 4,
    beatLength: 1,
    events: clickEvents.map((event) => ({
      ...event,
      sound: { kind: 'click', accent: 'soft' } as const
    }))
  })
  const buffer = await renderPractice(60, even, 6, (engine, context) => {
    context.setTimeout(
      () => engine.setMix({ ...MIX, click: { volume: 40, muted: false } }),
      2.5
    )
  })
  const peaks = onsets(buffer, 1e-3, 0.1).map((onset) => onset.peak)
  expect(peaks).toHaveLength(6)
  for (const k of [0, 1, 2]) expect(peaks[k + 3]).toBeLessThan(peaks[k] / 2)
})

test('un setMix que llega antes de que exista la cadena no se pierde', async () => {
  const buffer = await Tone.Offline(async (context) => {
    context.lookAhead = 0.1
    const engine = createToneEngine()
    const started = engine.start({
      bpm: 60,
      mix: MIX,
      barAt: clicks,
      onBeat: () => {},
      onEnd: () => {}
    })
    engine.setMix({ ...MIX, click: { volume: 80, muted: true } })
    await started
  }, 3)
  expect(onsets(buffer, 1e-3, 0.1)).toHaveLength(0)
})
