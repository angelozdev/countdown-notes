import create from 'zustand'
import { TNotes } from '../constants/notes'
import useIsPlaying from './useIsPlaying'

interface IUseExludedNotes {
  excludedNotes: Set<TNotes>
  xorExcludedNote: (note: TNotes) => void
  removeAll: () => void
}

const useExcludedNotes = create<IUseExludedNotes>((set, get) => ({
  excludedNotes: new Set<TNotes>(['C']),
  removeAll: () => {
    set((state) => {
      state.excludedNotes.clear()
      state.excludedNotes.add('C')
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
  }
}))

export default useExcludedNotes
