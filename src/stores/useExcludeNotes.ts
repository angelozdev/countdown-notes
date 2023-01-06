import create from 'zustand'
import { TNotes, noteList, sharpNotes, naturalNotes } from '../constants/notes'
import useIsPlaying from './useIsPlaying'

interface IUseExludedNotes {
  excludedNotes: Set<TNotes>
  xorExcludedNote: (note: TNotes) => void
  removeAll: () => void
  selectAll: () => void
  selectAllSharps: () => void
  removeAllSharps: () => void
  selectAllNaturals: () => void
  removeAllNaturals: () => void
}

const useExcludedNotes = create<IUseExludedNotes>((set, get) => ({
  excludedNotes: new Set<TNotes>(['C']),
  removeAll: () => {
    set((state) => {
      state.excludedNotes.clear()
      return { excludedNotes: state.excludedNotes }
    })
  },
  xorExcludedNote: (note) => {
    set((state) => {
      const wasAlreadyAdded = state.excludedNotes.has(note)
      if (wasAlreadyAdded) {
        state.excludedNotes.delete(note)
        return { excludedNotes: state.excludedNotes }
      }

      const excludedNotes = state.excludedNotes.add(note)
      const allChecked = excludedNotes.size > 10
      allChecked && useIsPlaying.setState({ isPlaying: false })
      return { excludedNotes }
    })
  },
  selectAll: () => {
    set(({ excludedNotes }) => {
      noteList.forEach((note) => excludedNotes.add(note))
      return { excludedNotes }
    })
  },
  selectAllSharps: () => {
    set(({ excludedNotes }) => {
      sharpNotes.forEach((note) => excludedNotes.add(note))
      return { excludedNotes }
    })
  },
  removeAllSharps: () => {
    set(({ excludedNotes }) => {
      sharpNotes.forEach((note) => excludedNotes.delete(note))
      return { excludedNotes }
    })
  },
  selectAllNaturals: () => {
    set(({ excludedNotes }) => {
      naturalNotes.forEach((note) => excludedNotes.add(note))
      return { excludedNotes }
    })
  },
  removeAllNaturals: () => {
    set(({ excludedNotes }) => {
      naturalNotes.forEach((note) => excludedNotes.delete(note))
      return { excludedNotes }
    })
  }
}))

export default useExcludedNotes
