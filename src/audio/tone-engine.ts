import * as Tone from 'tone'
import type { Accent, Channel, Engine, Mix, Sound, Style } from './engine'

// audioSession existe en Safari 17+, pero no está en los tipos del DOM
type AudioSessionNavigator = Navigator & { audioSession?: { type: string } }

// [Hz, velocidad] de cada acento (research.md §4)
const CLICKS: Record<Accent, [number, number]> = {
  strong: [1760, 1],
  soft: [1480, 0.8],
  none: [1175, 0.55]
}

// el volumen 80 es la mezcla de la entrega 1: clicks a −8 dB y bajo a 0 dB (research.md §6);
// el acorde, a −4 dB (Anexo A)
const BASE_DB: Record<Channel, number> = { click: -8, bass: 0, chord: -4 }
const CHANNELS: Channel[] = ['click', 'bass', 'chord']

// parámetros de partida de cada estilo (diseño, Anexo A); se afinan de oído (quickstart §4)
const STYLES: Record<
  Style,
  {
    bass: ConstructorParameters<typeof Tone.MonoSynth>[0]
    reverb: Partial<Tone.ReverbOptions>
    chorus: Partial<Tone.ChorusOptions>
    cutoff: number
    chord: Partial<Tone.PolySynthOptions<Tone.Synth>>['options']
  }
> = {
  warm: {
    bass: {
      oscillator: { type: 'sawtooth' },
      filter: { type: 'lowpass', Q: 3, rolloff: -24 },
      envelope: { attack: 0.005, decay: 0.2, sustain: 0.8, release: 0.3 },
      filterEnvelope: {
        attack: 0.005,
        decay: 0.3,
        sustain: 0.3,
        release: 0.3,
        baseFrequency: 120,
        octaves: 3.2
      },
      volume: -4
    },
    reverb: { decay: 2.5, wet: 0.3 },
    chorus: { frequency: 0.8, delayTime: 3.5, depth: 0.6, wet: 0.5 },
    cutoff: 1400,
    chord: {
      oscillator: { type: 'fatsawtooth', count: 3, spread: 20 },
      envelope: { attack: 0.04, decay: 0.6, sustain: 0.5, release: 1.5 },
      volume: -18
    }
  },
  pad: {
    bass: {
      oscillator: { type: 'triangle' },
      filter: { type: 'lowpass', Q: 0.5 },
      envelope: { attack: 0.15, decay: 0.5, sustain: 0.9, release: 1.5 },
      filterEnvelope: {
        attack: 0.2,
        decay: 0.5,
        sustain: 1,
        release: 1.5,
        baseFrequency: 300,
        octaves: 1
      },
      volume: -4
    },
    reverb: { decay: 6, wet: 0.5 },
    chorus: { frequency: 0.4, delayTime: 4, depth: 0.8, wet: 0.6 },
    cutoff: 1100,
    chord: {
      oscillator: { type: 'fattriangle', count: 3, spread: 30 },
      envelope: { attack: 0.8, decay: 1, sustain: 0.8, release: 3 },
      volume: -10
    }
  }
}

// bajo y acorde de un estilo: PolySynth → Filter → Chorus → Reverb. Sin conectar a la mezcla todavía
function createStyle({
  bass,
  reverb,
  chorus,
  cutoff,
  chord
}: (typeof STYLES)[Style]) {
  const reverbNode = new Tone.Reverb(reverb)
  const chorusNode = new Tone.Chorus(chorus).connect(reverbNode).start()
  const filter = new Tone.Filter(cutoff, 'lowpass').connect(chorusNode)
  const chordSynth = new Tone.PolySynth({
    voice: Tone.Synth,
    // con el Pad a tempo rápido, las notas con su release encima pasan de las 32 voces por defecto (research §4)
    maxPolyphony: 64,
    options: chord
  }).connect(filter)
  return {
    bass: new Tone.MonoSynth(bass),
    chord: chordSynth,
    reverb: reverbNode,
    nodes: [chordSynth, filter, chorusNode, reverbNode]
  }
}

const volumeGain = (channel: Channel, volume: number) =>
  volume === 0
    ? 0
    : Tone.dbToGain(BASE_DB[channel] + 40 * Math.log10(volume / 80))

export function createToneEngine(): Engine {
  // el contexto en que arrancó: con Tone.Offline, el global ya es otro cuando se llama a stop
  let context: Tone.BaseContext | undefined
  let nodes: Tone.ToneAudioNode[] = []
  let out: Tone.Gain | undefined
  let chain: Record<Channel, { mute: Tone.Gain; volume: Tone.Gain }> | undefined
  // la última mezcla recibida: setMix puede llegar antes de que exista la cadena
  let latestMix: Mix | undefined

  return {
    async start({ bpm, mix, barAt, onBeat, onEnd }) {
      latestMix = mix
      // iOS trata Web Audio como "ambient" y lo calla con el interruptor de silencio
      const { audioSession } = navigator as AudioSessionNavigator
      if (audioSession) audioSession.type = 'playback'
      await Tone.start()
      for (const node of nodes) node.dispose()

      context = Tone.getContext()
      const { transport, draw } = context
      // sintetizador → silencio → volumen → salida común, un tramo por canal
      // soft clipper (research.md §2): 8193 puntos, impar para que el silencio siga siendo exacto
      const shaper = new Tone.WaveShaper((x) => {
        const v = Math.abs(x) * 4
        const y = v <= 0.8 ? v : 0.8 + 0.2 * Math.tanh((v - 0.8) / 0.2)
        return Math.sign(x) * y
      }, 8193).toDestination()
      shaper.oversample = 'none'
      // 1/4 porque la entrada del WaveShaper se recorta a [−1, 1] y la suma de los canales puede pasar de 2
      const quarter = new Tone.Gain(0.25).connect(shaper)
      const output = new Tone.Gain(1).connect(quarter)
      // las dos cadenas siempre armadas: cambiar de estilo es elegir un sintetizador por compás.
      // Cada Reverb genera su respuesta antes de poder sonar
      const styles = {
        warm: createStyle(STYLES.warm),
        pad: createStyle(STYLES.pad)
      }
      await Promise.all(Object.values(styles).map(({ reverb }) => reverb.ready))
      // la mezcla más reciente: un setMix pudo llegar mientras esperaba a Tone.start() o al reverb
      const initial = latestMix
      const channel = (name: Channel) => {
        const { volume, muted } = initial[name]
        const volumeNode = new Tone.Gain(volumeGain(name, volume)).connect(
          output
        )
        const mute = new Tone.Gain(muted ? 0 : 1).connect(volumeNode)
        return { mute, volume: volumeNode }
      }
      const channels = {
        click: channel('click'),
        bass: channel('bass'),
        chord: channel('chord')
      }
      const makeClick = () =>
        new Tone.Synth({
          oscillator: { type: 'sine' },
          envelope: { attack: 0.001, decay: 0.06, sustain: 0, release: 0.01 }
        })
      const click = makeClick().connect(channels.click.mute)
      // la cuenta de entrada no pasa por el silencio del metrónomo
      const countClick = makeClick().connect(channels.click.volume)
      for (const { bass, reverb } of Object.values(styles)) {
        bass.connect(channels.bass.mute)
        reverb.connect(channels.chord.mute)
      }
      nodes = [
        shaper,
        quarter,
        output,
        click,
        countClick,
        ...Object.values(styles).flatMap(({ bass, nodes }) => [bass, ...nodes]),
        ...CHANNELS.flatMap((name) => [
          channels[name].mute,
          channels[name].volume
        ])
      ]
      out = output
      chain = channels

      // bpm.value aplicaría el tempo recién en now + lookAhead y el primer tiempo saldría corto
      const startAt = context.now()
      transport.bpm.setValueAtTime(bpm, startAt)
      const play = (
        sound: Sound,
        time: number,
        perBeat: number,
        countIn: boolean,
        style: Style
      ) => {
        if (sound.kind === 'click') {
          const [frequency, velocity] = CLICKS[sound.accent]
          const synth = countIn ? countClick : click
          synth.triggerAttackRelease(frequency, 0.05, time, velocity)
          return
        }
        // 90 % de su largo, para que cada ataque se distinga
        const length = transport.toSeconds(
          `${Math.round(sound.length * perBeat * 0.9)}i`
        )
        const { bass, chord } = styles[style]
        if (sound.kind === 'bass') {
          bass.triggerAttackRelease(sound.pitch, length, time)
        } else {
          chord.triggerAttackRelease(sound.pitches, length, time)
        }
      }
      function scheduleBar(bar: number, tick: number) {
        transport.scheduleOnce((time) => {
          const plan = barAt(bar)
          // el fin: avisa a la UI cuando el compás empezaría, y no programa nada más
          if (!plan) {
            draw.schedule(onEnd, time)
            return
          }
          const perBeat = Math.round(transport.PPQ * plan.beatLength)
          const barTicks = plan.beats * perBeat
          // los eventos de at = 0 suenan ya, en time; el resto se programa en su tick
          const at = (beats: number, fn: (time: number) => void) =>
            beats === 0
              ? fn(time)
              : transport.scheduleOnce(
                  fn,
                  `${tick + Math.round(beats * perBeat)}i`
                )
          for (const event of plan.events) {
            at(event.at, (t) =>
              play(
                event.sound,
                t,
                perBeat,
                !!plan.countIn,
                plan.style ?? 'warm'
              )
            )
          }
          for (let b = 0; b < plan.beats; b++) {
            at(b, (t) => draw.schedule(() => onBeat(bar, b), t))
          }
          scheduleBar(bar + 1, tick + barTicks)
        }, `${tick}i`)
      }
      scheduleBar(0, 0)
      transport.start(startAt)
    },
    stop() {
      if (!context) return
      context.transport.stop()
      context.transport.cancel()
      // sin argumento solo cancela lo que cae después de now() (con lookAhead), y quedan golpes en cola
      context.draw.cancel(0)
      // silenciar ya, sin anticipación, corta también lo ya programado. Es now − lookAhead
      // y no immediate(), porque en Tone.Offline immediate() vale 0 hasta el render
      const silenceAt = Math.max(0, context.now() - context.lookAhead)
      out?.gain.setValueAtTime(0, silenceAt)
    },
    setBpm(bpm) {
      context?.transport.bpm.setValueAtTime(bpm, context.now())
    },
    setMix(mix) {
      latestMix = mix
      if (!chain) return
      for (const name of CHANNELS) {
        const { volume, muted } = mix[name]
        chain[name].volume.gain.rampTo(volumeGain(name, volume), 0.02)
        chain[name].mute.gain.rampTo(muted ? 0 : 1, 0.02)
      }
    }
  }
}
