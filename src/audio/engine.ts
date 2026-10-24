export type Accent = 'strong' | 'soft' | 'none'

export type Sound =
  | { kind: 'click'; accent: Accent }
  | { kind: 'bass'; pitch: string; length: number } // altura de Tone ('Bb2'); length en golpes

export type Channel = 'click' | 'bass'

/** volume de 0 a 100; 80 es la mezcla de la entrega 1. */
export type Mix = Record<Channel, { volume: number; muted: boolean }>

export type Bar = {
  /** Golpes de metrónomo del compás. */
  beats: number
  /** Lo que dura un golpe, en unidades del BPM: 1, o 1/3 en 6/8, 9/8 y 12/8. */
  beatLength: number
  /** Cuenta de entrada: sus clicks suenan aunque el metrónomo esté silenciado. */
  countIn?: boolean
  /** Lo que suena; at va en golpes desde el inicio del compás (0, 0.5, 1, …). */
  events: { at: number; sound: Sound }[]
}

export type EngineStart = {
  bpm: number
  mix: Mix
  /** El compás que sigue. Se llama con anticipación, al programarlo. */
  barAt: (bar: number) => Bar
  /** Se llama cuando el golpe suena, sincronizado con el audio. */
  onBeat: (bar: number, beat: number) => void
}

export type Engine = {
  /** Desbloquea el audio y arranca en el compás 0, golpe 0. Se llama dentro del toque en Play. */
  start: (options: EngineStart) => Promise<void>
  /** Corta todo de inmediato. Después se puede volver a llamar a start. */
  stop: () => void
  /** Cambia el tempo desde el siguiente tiempo. */
  setBpm: (bpm: number) => void
  /** Cambia volúmenes y silencios de inmediato. */
  setMix: (mix: Mix) => void
}
