import * as Tone from 'tone'
import { expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import {
  accentAt,
  bassAttacks,
  type BassFigure,
  METERS,
  type Meter
} from '@/music/meters'
import type { Bar, Engine, EngineStart, Mix, Sound, Style } from './engine'
import { createToneEngine } from './tone-engine'

type During = (engine: Engine, context: Tone.OfflineContext) => void

// la mezcla por defecto: los tres canales en 80, sin silenciar
const MIX: Mix = {
  click: { volume: 80, muted: false },
  bass: { volume: 80, muted: false },
  chord: { volume: 80, muted: false }
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

// tiempo real: Draw es el único enlace entre el reloj del audio y la pantalla. Los timers de aquí
// solo esperan, no marcan tiempo musical
test('onBeat llega golpe por golpe, en orden, y onEnd una sola vez al terminar', async () => {
  const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
  const unlock = document.body.appendChild(document.createElement('button'))
  unlock.addEventListener('click', () => void Tone.start())
  await userEvent.click(unlock)
  unlock.remove()

  const engine = createToneEngine()
  const twoBars: EngineStart['barAt'] = (bar) =>
    bar < 2 ? { beats: 4, beatLength: 1, events: clickEvents } : undefined
  const expected = [0, 1].flatMap((bar) =>
    [0, 1, 2, 3].map((beat) => [bar, beat])
  )
  // la segunda vuelta empieza después del fin natural de la primera
  for (const run of [1, 2]) {
    const beats: number[][] = []
    let ends = 0
    let beatsAtEnd = -1
    await engine.start({
      bpm: 240,
      mix: MIX,
      barAt: twoBars,
      onBeat: (bar, beat) => beats.push([bar, beat]),
      onEnd: () => {
        ends++
        beatsAtEnd = beats.length
        // la app para aquí (onEnd es stop); volver a llamar a start sin parar no programa nada
        engine.stop()
      }
    })
    // 2 s de música; el tope solo evita colgarse si onEnd nunca llega
    for (let i = 0; ends === 0 && i < 400; i++) await wait(10)
    // el margen deja caer cualquier aviso de más
    await wait(500)
    expect(beats, `vuelta ${run}`).toEqual(expected)
    expect(ends, `vuelta ${run}`).toBe(1)
    expect(beatsAtEnd, `vuelta ${run}`).toBe(expected.length)
  }
}, 15_000)

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

const FIGURES: BassFigure[] = ['eighth', 'quarter', 'half', 'whole']

// SC-002: con cada compás y cada figura, el motor real ataca el bajo donde dice la teoría.
// Se mide en las llamadas al sintetizador, porque con notas ligadas el release de una tapa el
// inicio de la siguiente y no se distingue en el audio
test.each(
  METERS.flatMap((meter) => FIGURES.map((figure) => ({ meter, figure })))
)(
  'en $meter.id con la figura $figure, cada ataque del bajo cae en su tiempo',
  async ({ meter, figure }) => {
    const bpm = 240
    const beat = (meter.beatLength * 60) / bpm
    const attacks = bassAttacks(meter, figure)
    const pitchOf = (bar: number) => (bar === 0 ? 'C3' : 'D3')
    const spy = vi.spyOn(Tone.MonoSynth.prototype, 'triggerAttackRelease')
    try {
      await renderPractice(
        bpm,
        (bar): Bar | undefined =>
          bar < 2
            ? {
                beats: meter.beats,
                beatLength: meter.beatLength,
                events: attacks.map(({ at, length }) => ({
                  at,
                  sound: { kind: 'bass', pitch: pitchOf(bar), length }
                }))
              }
            : undefined,
        2 * meter.beats * beat + 0.2
      )
      const calls = spy.mock.calls
      expect(calls).toHaveLength(2 * attacks.length)
      // el primer ataque cae en el tiempo 1; los demás se miden desde él
      const start = calls[0][2] as number
      for (const [k, [note, duration, time]] of calls.entries()) {
        const bar = Math.floor(k / attacks.length)
        const { at, length } = attacks[k % attacks.length]
        expect(note).toBe(pitchOf(bar))
        expect(
          Math.abs((time as number) - (start + (bar * meter.beats + at) * beat))
        ).toBeLessThan(0.001)
        // 90 % de su largo, con la redondeada a un tick (1,3 ms a 240 BPM)
        expect(
          Math.abs((duration as number) - 0.9 * length * beat)
        ).toBeLessThan(0.002)
      }
    } finally {
      spy.mockRestore()
    }
  }
)

// la frecuencia fundamental, por autocorrelación: el período es el primer retraso que repite la onda
function fundamental(data: Float32Array, rate: number) {
  const correlation = (lag: number) => {
    let sum = 0
    for (let i = 0; i + lag < data.length; i++) sum += data[i] * data[i + lag]
    return sum
  }
  const lags = Array.from(
    { length: Math.round(rate / 80) - Math.round(rate / 600) },
    (_, k) => Math.round(rate / 600) + k
  )
  const scores = lags.map(correlation)
  const best = Math.max(...scores)
  return rate / lags[scores.findIndex((score) => score >= 0.95 * best)]
}

test('la octava llega al motor como altura: una más arriba suena al doble de frecuencia', async () => {
  const hz = async (pitch: string) => {
    // una redonda a 240 BPM en 4/4 dura 1 s; se mide entre 0,3 y 0,5 s después del ataque
    const buffer = await renderPractice(
      240,
      (bar): Bar | undefined =>
        bar === 0
          ? {
              beats: 4,
              beatLength: 1,
              events: [{ at: 0, sound: { kind: 'bass', pitch, length: 4 } }]
            }
          : undefined,
      1.5
    )
    const [{ time }] = onsets(buffer, 1e-5, 1)
    const { sampleRate } = buffer
    return fundamental(
      buffer
        .getChannelData(0)
        .slice(
          Math.round((time + 0.3) * sampleRate),
          Math.round((time + 0.5) * sampleRate)
        ),
      sampleRate
    )
  }
  const [c3, c4] = [await hz('C3'), await hz('C4')]
  expect(c3 / 130.81).toBeCloseTo(1, 1)
  expect(c4 / c3).toBeCloseTo(2, 1)
})

// cuenta, y luego dos compases con un click fuerte en cada golpe y un bajo grave sostenido
const loudBars = (): EngineStart['barAt'] => (bar) => {
  if (bar === 0) {
    return { beats: 4, beatLength: 1, countIn: true, events: clickEvents }
  }
  if (bar > 2) return undefined
  return {
    beats: 4,
    beatLength: 1,
    events: [
      ...[0, 1, 2, 3].map((at) => ({
        at,
        sound: { kind: 'click', accent: 'strong' } as const
      })),
      {
        at: 0,
        sound: { kind: 'bass', pitch: bar === 1 ? 'E1' : 'C2', length: 4 }
      }
    ]
  }
}

test('con la mezcla por defecto, ninguna muestra pasa de 1', async () => {
  const data = (await renderPractice(120, loudBars(), 6.5)).getChannelData(0)
  // el bajo suena de verdad, para que el tope no se cumpla por silencio
  expect(data.some((sample) => Math.abs(sample) > 0.5)).toBe(true)
  expect(data.every((sample) => Math.abs(sample) <= 1)).toBe(true)
})

test('con los dos canales al máximo, ninguna muestra pasa de 1', async () => {
  const data = (
    await renderPractice(120, loudBars(), 6.5, undefined, {
      ...MIX,
      click: { volume: 100, muted: false },
      bass: { volume: 100, muted: false }
    })
  ).getChannelData(0)
  expect(data.some((sample) => Math.abs(sample) > 0.5)).toBe(true)
  expect(data.every((sample) => Math.abs(sample) <= 1)).toBe(true)
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

test('después del último compás no suena nada', async () => {
  // dos compases con clicks y un bajo de 4 golpes; desde el 2, el fin
  const buffer = await renderPractice(
    60,
    (bar): Bar | undefined =>
      bar < 2
        ? {
            beats: 4,
            beatLength: 1,
            events: [
              ...clickEvents,
              { at: 0, sound: { kind: 'bass', pitch: 'Bb2', length: 4 } }
            ]
          }
        : undefined,
    10
  )
  expect(onsets(buffer, 1e-3, 0.1)).toHaveLength(2)
  const after = buffer
    .getChannelData(0)
    .slice(Math.round(8.5 * buffer.sampleRate))
  expect(after.every((sample) => Math.abs(sample) <= 1e-3)).toBe(true)
})

// la cuenta (compás 0, a 60 BPM dura 4 s) y un compás con un acorde de C mayor en voicing abierto
const chordBar =
  (length: number): EngineStart['barAt'] =>
  (bar): Bar | undefined => {
    if (bar === 0) {
      return { beats: 4, beatLength: 1, countIn: true, events: clickEvents }
    }
    if (bar > 1) return undefined
    return {
      beats: 4,
      beatLength: 1,
      events: [
        {
          at: 0,
          sound: { kind: 'chord', pitches: ['C3', 'G3', 'E4'], length }
        }
      ]
    }
  }

test('el acorde ataca a tiempo y dura lo que dice length', async () => {
  // uno tras otro: Tone.Offline cambia el contexto global mientras renderiza
  const long = await renderPractice(60, chordBar(4), 9)
  const short = await renderPractice(60, chordBar(2), 9)
  // la cuenta son 4 clicks; el primer onset después de 3,9 s es el acorde
  const rms = (buffer: Tone.ToneAudioBuffer, from: number, to: number) => {
    const part = buffer
      .getChannelData(0)
      .slice(
        Math.round(from * buffer.sampleRate),
        Math.round(to * buffer.sampleRate)
      )
    return Math.sqrt(part.reduce((sum, x) => sum + x * x, 0) / part.length)
  }
  for (const buffer of [long, short]) {
    const found = onsets(buffer, 1e-4, 0.5)
    const chord = found.find(({ time }) => time > 3.9)!
    expect(Math.abs(chord.time - (found[0].time + 4))).toBeLessThan(0.001)
  }
  const attack = onsets(long, 1e-4, 0.5).find(({ time }) => time > 3.9)!.time
  expect(rms(short, attack + 2.6, attack + 2.7)).toBeLessThan(
    rms(long, attack + 2.6, attack + 2.7) / 2
  )
})

test('el acorde silenciado no suena', async () => {
  const buffer = await renderPractice(60, chordBar(4), 9, undefined, {
    ...MIX,
    chord: { volume: 80, muted: true }
  })
  const after = buffer
    .getChannelData(0)
    .slice(Math.round(3.9 * buffer.sampleRate))
  expect(after.every((sample) => Math.abs(sample) <= 1e-4)).toBe(true)
})

// el escenario de la mezcla, más un acorde de 5 notas sostenido en los compases 1 y 2
const loudBarsWithChord = (): EngineStart['barAt'] => {
  const base = loudBars()
  return (bar) => {
    const plan = base(bar)
    if (!plan || bar === 0) return plan
    return {
      ...plan,
      events: [
        ...plan.events,
        {
          at: 0,
          sound: {
            kind: 'chord',
            pitches: ['E3', 'G3', 'B3', 'D4', 'Gb4'],
            length: 4
          }
        }
      ]
    }
  }
}

test('con el acorde, la mezcla tampoco pasa de 1', async () => {
  const maxed: Mix = {
    click: { volume: 100, muted: false },
    bass: { volume: 100, muted: false },
    chord: { volume: 100, muted: false }
  }
  for (const mix of [MIX, maxed]) {
    const data = (
      await renderPractice(120, loudBarsWithChord(), 6.5, undefined, mix)
    ).getChannelData(0)
    expect(data.some((sample) => Math.abs(sample) > 0.5)).toBe(true)
    expect(data.every((sample) => Math.abs(sample) <= 1)).toBe(true)
  }
})

// el RMS del canal 0 en [from, from + 0,02 s]
const rms = (buffer: Tone.ToneAudioBuffer, from: number) => {
  const part = buffer
    .getChannelData(0)
    .slice(
      Math.round(from * buffer.sampleRate),
      Math.round((from + 0.02) * buffer.sampleRate)
    )
  return Math.sqrt(part.reduce((sum, x) => sum + x * x, 0) / part.length)
}

const CHORD: Sound = { kind: 'chord', pitches: ['C3', 'G3', 'E4'], length: 4 }
const BASS: Sound = { kind: 'bass', pitch: 'C2', length: 4 }

// la cuenta y, luego, un compás por estilo, cada uno con el mismo sonido
const styledBars =
  (styles: Style[], sound: Sound): EngineStart['barAt'] =>
  (bar): Bar | undefined => {
    if (bar === 0) {
      return { beats: 4, beatLength: 1, countIn: true, events: clickEvents }
    }
    if (bar > styles.length) return undefined
    return {
      beats: 4,
      beatLength: 1,
      style: styles[bar - 1],
      events: [{ at: 0, sound }]
    }
  }

// el inicio del compás 1 es el primer click de la cuenta más cuatro segundos (60 BPM)
async function renderStyled(styles: Style[], sound: Sound) {
  const buffer = await renderPractice(60, styledBars(styles, sound), 9)
  return { buffer, t: onsets(buffer, 1e-4, 0.5)[0].time + 4 }
}

test('el bajo y el acorde de un compás suenan con su estilo', async () => {
  // uno tras otro: Tone.Offline cambia el contexto global mientras renderiza
  const warmChord = await renderStyled(['warm'], CHORD)
  const padChord = await renderStyled(['pad'], CHORD)
  const warmBass = await renderStyled(['warm'], BASS)
  const padBass = await renderStyled(['pad'], BASS)
  // el cálido ataca de golpe y el Pad entra lento
  const chordRatio = ({ buffer, t }: typeof warmChord) =>
    rms(buffer, t + 0.05) / rms(buffer, t + 1.5)
  const bassRatio = ({ buffer, t }: typeof warmBass) =>
    rms(buffer, t + 0.01) / rms(buffer, t + 0.5)
  expect(chordRatio(warmChord)).toBeGreaterThan(0.8)
  expect(chordRatio(padChord)).toBeLessThan(0.3)
  expect(bassRatio(warmBass)).toBeGreaterThan(0.8)
  expect(bassRatio(padBass)).toBeLessThan(0.3)
})

test('cambiar de estilo no corta lo que sigue sonando', async () => {
  const { buffer, t } = await renderStyled(['warm', 'pad'], CHORD)
  const t2 = t + 4
  // la cola del acorde cálido sigue ahí cuando entra el compás del Pad
  expect(rms(buffer, t2 + 0.02)).toBeGreaterThan(0.3 * rms(buffer, t2 - 0.04))
})

test('con el Pad, la mezcla tampoco pasa de 1', async () => {
  const base = loudBarsWithChord()
  const padBars: EngineStart['barAt'] = (bar) => {
    const plan = base(bar)
    return plan && bar > 0 ? { ...plan, style: 'pad' } : plan
  }
  const maxed: Mix = {
    click: { volume: 100, muted: false },
    bass: { volume: 100, muted: false },
    chord: { volume: 100, muted: false }
  }
  for (const mix of [MIX, maxed]) {
    const data = (
      await renderPractice(120, padBars, 6.5, undefined, mix)
    ).getChannelData(0)
    expect(data.some((sample) => Math.abs(sample) > 0.5)).toBe(true)
    expect(data.every((sample) => Math.abs(sample) <= 1)).toBe(true)
  }
})
