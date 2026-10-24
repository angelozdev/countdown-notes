export type Sound =
  | { kind: 'click'; accent: boolean }
  | { kind: 'bass'; pitch: string } // altura de Tone, p. ej. 'Bb2'

export type EngineStart = {
  bpm: number
  beatsPerBar: number
  /** Qué suena en ese tiempo. Se llama con anticipación, al programarlo. */
  soundsAt: (bar: number, beat: number) => Sound[]
  /** Se llama cuando ese tiempo suena, sincronizado con el audio. */
  onBeat: (bar: number, beat: number) => void
}

export type Engine = {
  /** Desbloquea el audio y arranca en el compás 0, tiempo 0. Se llama dentro del toque en Play. */
  start: (options: EngineStart) => Promise<void>
  /** Corta todo de inmediato. Después se puede volver a llamar a start. */
  stop: () => void
  /** Cambia el tempo desde el siguiente tiempo. */
  setBpm: (bpm: number) => void
}
