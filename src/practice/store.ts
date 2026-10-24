import { createContext, useContext } from 'react'
import { useStore } from 'zustand'
import { createStore } from 'zustand/vanilla'
import type { Bar, Engine } from '@/audio/engine'
import {
  accentAt,
  type BassFigure,
  bassAttacks,
  METER_BY_ID,
  type Meter,
  type MeterId
} from '@/music/meters'
import { NOTES, type Note, type NoteId } from '@/music/notes'
import { drawRound } from './round'

export type Status = 'stopped' | 'countIn' | 'playing'

export type Round = {
  number: number
  /** Orden sorteado: cada nota del pool una vez. */
  notes: NoteId[]
  /** Copia del ajuste al sortearla; no cambia después. */
  barsPerNote: number
  /** Copia del ajuste al sortearla; no cambia después. */
  meter: MeterId
  /** Compás global donde empieza: el 0 es la cuenta de entrada. */
  firstBar: number
}

export type PracticeState = {
  status: Status
  /** Lo que está sonando: el compás 0 es la cuenta de entrada. */
  position: { bar: number; beat: number } | null
  bpm: number
  barsPerNote: number
  notes: NoteId[]
  meter: MeterId
  bassFigure: BassFigure
  bassOctave: 1 | 2 | 3
  /** La vuelta que suena y, desde su última nota, la siguiente. */
  rounds: Round[]
  play: () => void
  stop: () => void
  setBpm: (bpm: number) => void
  setBarsPerNote: (barsPerNote: number) => void
  setMeter: (meter: MeterId) => void
  setBassFigure: (figure: BassFigure) => void
  setBassOctave: (octave: 1 | 2 | 3) => void
  toggleNote: (id: NoteId) => void
  setGroup: (natural: boolean, included: boolean) => void
}

export type PracticeStore = ReturnType<typeof createPracticeStore>

export const roundLength = (round: Round) =>
  round.notes.length * round.barsPerNote

/** Índice, dentro de la vuelta, de la nota que suena en ese compás. */
export const noteIndexAt = (round: Round, bar: number) =>
  Math.floor((bar - round.firstBar) / round.barsPerNote)

/** La vuelta y la nota que están sonando, si ya pasó la cuenta de entrada. */
export function nowPlaying({ status, position, rounds }: PracticeState) {
  if (status !== 'playing' || !position) return undefined
  const round = rounds[0]
  return { round, index: noteIndexAt(round, position.bar) }
}

/** El compás que suena (el de la vuelta actual) o, detenida, el de los ajustes. */
export const meterOf = (state: PracticeState): Meter =>
  METER_BY_ID[state.rounds[0]?.meter ?? state.meter]

export const NOT_ENOUGH_NOTES = 'Elige al menos 2 notas para tocar.'

/** Con menos de 2 notas no se puede evitar repetir una nota seguida. */
export const canPlay = (state: PracticeState) => state.notes.length >= 2

/** Las notas incluidas, sin duplicados y en orden cromático. */
const notesWhere = (included: (note: Note) => boolean) =>
  NOTES.filter(included).map((note) => note.id)

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Math.round(value)))

export function createPracticeStore(engine: Engine) {
  return createStore<PracticeState>()((set, get) => {
    function nextRound(previous: Round): Round {
      const { notes, barsPerNote, meter } = get()
      // con menos de 2 notas no se puede sortear: sigue con las de la vuelta anterior
      const pool = notes.length >= 2 ? notes : previous.notes
      return {
        number: previous.number + 1,
        notes: drawRound(pool, previous.notes.at(-1)),
        barsPerNote,
        meter,
        firstBar: previous.firstBar + roundLength(previous)
      }
    }

    const clicksOf = (meter: Meter) =>
      Array.from({ length: meter.beats }, (_, at): Bar['events'][number] => ({
        at,
        sound: { kind: 'click', accent: accentAt(meter, at) }
      }))

    const planOf = ({ beats, beatLength }: Meter) => ({ beats, beatLength })

    function barAt(bar: number): Bar {
      const { rounds } = get()
      if (bar === 0) {
        const meter = METER_BY_ID[rounds[0].meter]
        return { ...planOf(meter), events: clicksOf(meter) }
      }

      const round = rounds.find(
        (r) => bar >= r.firstBar && bar < r.firstBar + roundLength(r)
      )!
      const meter = METER_BY_ID[round.meter]
      const index = noteIndexAt(round, bar)
      const lastNoteBar =
        round.firstBar + (round.notes.length - 1) * round.barsPerNote
      // la siguiente vuelta se sortea al empezar la última nota, para mostrarla por adelantado
      if (bar === lastNoteBar && round === rounds.at(-1)) {
        set({ rounds: [...rounds, nextRound(round)] })
      }
      // figura y octava se leen aquí, al armar el compás: un cambio aplica desde el siguiente
      const { bassFigure, bassOctave } = get()
      const bass = bassAttacks(meter, bassFigure).map(
        ({ at }): Bar['events'][number] => ({
          at,
          sound: { kind: 'bass', pitch: `${round.notes[index]}${bassOctave}` }
        })
      )
      // el sort es estable: en el mismo at, el click queda antes que el bajo
      return {
        ...planOf(meter),
        events: [...clicksOf(meter), ...bass].sort((a, b) => a.at - b.at)
      }
    }

    function onBeat(bar: number, beat: number) {
      const { rounds } = get()
      const current = rounds.filter((r) => r.firstBar + roundLength(r) > bar)
      set({
        position: { bar, beat },
        status: bar === 0 ? 'countIn' : 'playing',
        rounds: current.length === rounds.length ? rounds : current
      })
    }

    return {
      status: 'stopped',
      position: null,
      bpm: 60,
      barsPerNote: 2,
      meter: '4/4',
      bassFigure: 'whole',
      bassOctave: 2,
      notes: NOTES.map((note) => note.id),
      rounds: [],
      play() {
        const { status, notes, barsPerNote, meter, bpm } = get()
        if (status !== 'stopped' || !canPlay(get())) return
        set({
          status: 'countIn',
          position: null,
          rounds: [
            {
              number: 1,
              notes: drawRound(notes),
              barsPerNote,
              meter,
              firstBar: 1
            }
          ]
        })
        engine.start({ bpm, barAt, onBeat }).catch(() => get().stop())
      },
      stop() {
        engine.stop()
        set({ status: 'stopped', position: null, rounds: [] })
      },
      setBpm(bpm) {
        const next = clamp(bpm, 30, 240)
        set({ bpm: next })
        if (get().status !== 'stopped') engine.setBpm(next)
      },
      setBarsPerNote(barsPerNote) {
        set({ barsPerNote: clamp(barsPerNote, 1, 16) })
      },
      setMeter(meter) {
        set({ meter })
      },
      setBassFigure(bassFigure) {
        set({ bassFigure })
      },
      setBassOctave(bassOctave) {
        set({ bassOctave })
      },
      toggleNote(id) {
        const { notes } = get()
        const wasIncluded = notes.includes(id)
        set({
          notes: notesWhere((note) =>
            note.id === id ? !wasIncluded : notes.includes(note.id)
          )
        })
      },
      setGroup(natural, included) {
        const { notes } = get()
        set({
          notes: notesWhere((note) =>
            note.natural === natural ? included : notes.includes(note.id)
          )
        })
      }
    }
  })
}

export const PracticeContext = createContext<PracticeStore | null>(null)

export function usePractice<T>(selector: (state: PracticeState) => T): T {
  const store = useContext(PracticeContext)
  if (!store) throw new Error('usePractice necesita un PracticeContext')
  return useStore(store, selector)
}
