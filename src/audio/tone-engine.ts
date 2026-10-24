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
      nodes = [click, clickBus]
      buses = [clickBus]

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
