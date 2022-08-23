import createStore from 'zustand'
import { TNotes } from '../constants/notes'

export enum Units {
  SECONDS = 'sec',
  MINUTES = 'min',
  HOURS = 'hrs'
}

interface IUseCountdown {
  duration: number
  excludedNotes: Set<TNotes>
  getCanPlayState: () => boolean
  isPlaying: boolean
  toggleIsPlaying: () => void
  unit: Units
  updateDuration: (duration: number) => void
  updateUnit: (unit: Units) => void
  xorExcludedNote: (note: TNotes) => void
}

export const useCountdown = createStore<IUseCountdown>((set, get) => ({
  duration: 5,
  unit: Units.SECONDS,
  excludedNotes: new Set(),
  isPlaying: false,
  getCanPlayState: () => {
    const { excludedNotes, duration } = get()
    const allExcludedNotesAreChecked = excludedNotes.size > 10
    const isDurationValid = duration > 0
    const shouldCanPlay = !allExcludedNotesAreChecked && isDurationValid
    return shouldCanPlay
  },
  updateDuration: (duration) => {
    set((state) => ({
      duration,
      isPlaying: duration <= 0 ? false : state.isPlaying
    }))
  },
  updateUnit: (unit) => set({ unit }),
  toggleIsPlaying: () =>
    set((state) => ({
      isPlaying: !state.isPlaying
    })),
  xorExcludedNote: (note) => {
    set((state) => {
      const wasAlreadyAdded = state.excludedNotes.has(note)
      if (wasAlreadyAdded) {
        state.excludedNotes.delete(note)
        return { excludedNotes: state.excludedNotes }
      }

      const excludedNotes = state.excludedNotes.add(note)
      const allChecked = excludedNotes.size > 10
      return { excludedNotes, isPlaying: allChecked ? false : state.isPlaying }
    })
  }
}))
