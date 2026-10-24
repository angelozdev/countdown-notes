import * as Tone from 'tone'
import type { Engine } from './engine'

// audioSession existe en Safari 17+, pero no está en los tipos del DOM
type AudioSessionNavigator = Navigator & { audioSession?: { type: string } }

export function createToneEngine(): Engine {
  // el contexto en que arrancó: con Tone.Offline, el global ya es otro cuando se llama a stop
  let context: Tone.BaseContext | undefined
  let nodes: Tone.ToneAudioNode[] = []
  let buses: Tone.Volume[] = []

  return {
    async start({ bpm, beatsPerBar, soundsAt, onBeat }) {
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
      transport.timeSignature = beatsPerBar
      let k = 0
      transport.scheduleRepeat(
        (time) => {
          const bar = Math.floor(k / beatsPerBar)
          const beat = k % beatsPerBar
          k++
          for (const sound of soundsAt(bar, beat)) {
            if (sound.kind === 'click') {
              click.triggerAttackRelease(
                sound.accent ? 1760 : 1175,
                0.05,
                time,
                sound.accent ? 1 : 0.55
              )
            } else {
              // 90 % del compás, para que cada ataque se distinga
              const duration = transport.toSeconds('1m') * 0.9
              bass.triggerAttackRelease(sound.pitch, duration, time)
            }
          }
          draw.schedule(() => onBeat(bar, beat), time)
        },
        '4n',
        0
      )
      transport.start(startAt)
    },
    stop() {
      if (!context) return
      context.transport.stop()
      context.transport.cancel()
      context.draw.cancel()
      // silenciar ya, sin anticipación, corta también lo ya programado. Es now − lookAhead
      // y no immediate(), porque en Tone.Offline immediate() vale 0 hasta el render
      const silenceAt = Math.max(0, context.now() - context.lookAhead)
      for (const bus of buses) bus.volume.setValueAtTime(-Infinity, silenceAt)
    },
    setBpm(bpm) {
      context?.transport.bpm.setValueAtTime(bpm, context.now())
    }
  }
}
