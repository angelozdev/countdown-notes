import * as Tone from 'tone'
import type { Accent, Channel, Engine, Mix, Sound } from './engine'

// audioSession existe en Safari 17+, pero no está en los tipos del DOM
type AudioSessionNavigator = Navigator & { audioSession?: { type: string } }

// [Hz, velocidad] de cada acento (research.md §4)
const CLICKS: Record<Accent, [number, number]> = {
  strong: [1760, 1],
  soft: [1480, 0.8],
  none: [1175, 0.55]
}

// el volumen 80 es la mezcla de la entrega 1: clicks a −8 dB y bajo a 0 dB (research.md §6)
const BASE_DB: Record<Channel, number> = { click: -8, bass: 0 }
const CHANNELS: Channel[] = ['click', 'bass']

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
    async start({ bpm, mix, barAt, onBeat }) {
      latestMix = mix
      // iOS trata Web Audio como "ambient" y lo calla con el interruptor de silencio
      const { audioSession } = navigator as AudioSessionNavigator
      if (audioSession) audioSession.type = 'playback'
      await Tone.start()
      for (const node of nodes) node.dispose()

      context = Tone.getContext()
      const { transport, draw } = context
      // sintetizador → silencio → volumen → salida común, un tramo por canal
      const output = new Tone.Gain(1).toDestination()
      // la mezcla más reciente: un setMix pudo llegar mientras esperaba a Tone.start()
      const initial = latestMix
      const channel = (name: Channel) => {
        const { volume, muted } = initial[name]
        const volumeNode = new Tone.Gain(volumeGain(name, volume)).connect(
          output
        )
        const mute = new Tone.Gain(muted ? 0 : 1).connect(volumeNode)
        return { mute, volume: volumeNode }
      }
      const channels = { click: channel('click'), bass: channel('bass') }
      const makeClick = () =>
        new Tone.Synth({
          oscillator: { type: 'sine' },
          envelope: { attack: 0.001, decay: 0.06, sustain: 0, release: 0.01 }
        })
      const click = makeClick().connect(channels.click.mute)
      // la cuenta de entrada no pasa por el silencio del metrónomo
      const countClick = makeClick().connect(channels.click.volume)
      // bajo Analógico cálido (diseño, Anexo A)
      const bass = new Tone.MonoSynth({
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
      }).connect(channels.bass.mute)
      nodes = [
        output,
        click,
        countClick,
        bass,
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
        countIn: boolean
      ) => {
        if (sound.kind === 'click') {
          const [frequency, velocity] = CLICKS[sound.accent]
          const synth = countIn ? countClick : click
          synth.triggerAttackRelease(frequency, 0.05, time, velocity)
        } else {
          // 90 % de su largo, para que cada ataque se distinga
          const ticks = Math.round(sound.length * perBeat * 0.9)
          bass.triggerAttackRelease(
            sound.pitch,
            transport.toSeconds(`${ticks}i`),
            time
          )
        }
      }
      function scheduleBar(bar: number, tick: number) {
        transport.scheduleOnce((time) => {
          const plan = barAt(bar)
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
            at(event.at, (t) => play(event.sound, t, perBeat, !!plan.countIn))
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
