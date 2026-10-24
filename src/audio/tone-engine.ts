import * as Tone from 'tone'
import type { Accent, Engine, Sound } from './engine'

// audioSession existe en Safari 17+, pero no está en los tipos del DOM
type AudioSessionNavigator = Navigator & { audioSession?: { type: string } }

// [Hz, velocidad] de cada acento (research.md §4)
const CLICKS: Record<Accent, [number, number]> = {
  strong: [1760, 1],
  soft: [1480, 0.8],
  none: [1175, 0.55]
}

export function createToneEngine(): Engine {
  // el contexto en que arrancó: con Tone.Offline, el global ya es otro cuando se llama a stop
  let context: Tone.BaseContext | undefined
  let nodes: Tone.ToneAudioNode[] = []
  let buses: Tone.Volume[] = []

  return {
    async start({ bpm, barAt, onBeat }) {
      // iOS trata Web Audio como "ambient" y lo calla con el interruptor de silencio
      const { audioSession } = navigator as AudioSessionNavigator
      if (audioSession) audioSession.type = 'playback'
      await Tone.start()
      for (const node of nodes) node.dispose()

      context = Tone.getContext()
      const { transport, draw } = context
      const clickBus = new Tone.Volume(-8).toDestination()
      const click = new Tone.Synth({
        oscillator: { type: 'sine' },
        envelope: { attack: 0.001, decay: 0.06, sustain: 0, release: 0.01 }
      }).connect(clickBus)
      // bajo Analógico cálido (diseño, Anexo A)
      const bassBus = new Tone.Volume(0).toDestination()
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
      }).connect(bassBus)
      nodes = [click, clickBus, bass, bassBus]
      buses = [clickBus, bassBus]

      // bpm.value aplicaría el tempo recién en now + lookAhead y el primer tiempo saldría corto
      const startAt = context.now()
      transport.bpm.setValueAtTime(bpm, startAt)
      const play = (sound: Sound, time: number, perBeat: number) => {
        if (sound.kind === 'click') {
          const [frequency, velocity] = CLICKS[sound.accent]
          click.triggerAttackRelease(frequency, 0.05, time, velocity)
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
            at(event.at, (t) => play(event.sound, t, perBeat))
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
      for (const bus of buses) bus.volume.setValueAtTime(-Infinity, silenceAt)
    },
    setBpm(bpm) {
      context?.transport.bpm.setValueAtTime(bpm, context.now())
    },
    // la cadena de volumen y silencio llega en T025
    setMix() {}
  }
}
