import { createContext, useContext } from 'react'
import { useStore } from 'zustand'
import { createStore } from 'zustand/vanilla'
import type { Engine, Sound } from '@/audio/engine'
import { NOTES, type NoteId } from '@/music/notes'
import { drawRound } from './round'

export type Status = 'stopped' | 'countIn' | 'playing'

export type Round = {
  number: number
  /** Orden sorteado: cada nota del pool una vez. */
  notes: NoteId[]
  /** Copia del ajuste al sortearla; no cambia después. */
  barsPerNote: number
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
  /** La vuelta que suena y, desde su última nota, la siguiente. */
  rounds: Round[]
  play: () => void
  stop: () => void
  setBpm: (bpm: number) => void
  setBarsPerNote: (barsPerNote: number) => void
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

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Math.round(value)))

export function createPracticeStore(engine: Engine) {
  return createStore<PracticeState>()((set, get) => {
    function nextRound(previous: Round): Round {
      const { notes, barsPerNote } = get()
      // con menos de 2 notas no se puede sortear: sigue con las de la vuelta anterior
      const pool = notes.length >= 2 ? notes : previous.notes
      return {
        number: previous.number + 1,
        notes: drawRound(pool, previous.notes.at(-1)),
        barsPerNote,
        firstBar: previous.firstBar + roundLength(previous)
      }
    }

    function soundsAt(bar: number, beat: number): Sound[] {
      const sounds: Sound[] = [{ kind: 'click', accent: beat === 0 }]
      if (bar === 0 || beat !== 0) return sounds

      const { rounds } = get()
      const round = rounds.find(
        (r) => bar >= r.firstBar && bar < r.firstBar + roundLength(r)
      )!
      const index = noteIndexAt(round, bar)
      const lastNoteBar =
        round.firstBar + (round.notes.length - 1) * round.barsPerNote
      // la siguiente vuelta se sortea al empezar la última nota, para mostrarla por adelantado
      if (bar === lastNoteBar && round === rounds.at(-1)) {
        set({ rounds: [...rounds, nextRound(round)] })
      }
      sounds.push({ kind: 'bass', pitch: `${round.notes[index]}2` })
      return sounds
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
      notes: NOTES.map((note) => note.id),
      rounds: [],
      play() {
        const { status, notes, barsPerNote, bpm } = get()
        if (status !== 'stopped') return
        set({
          status: 'countIn',
          position: null,
          rounds: [
            { number: 1, notes: drawRound(notes), barsPerNote, firstBar: 1 }
          ]
        })
        engine
          .start({ bpm, beatsPerBar: 4, soundsAt, onBeat })
          .catch(() => get().stop())
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
