import create from 'zustand'
import useDuration from './useDuration'
import useCountdown from './useExcludeNotes'

interface IUseIsPlaying {
  isPlaying: boolean
  toggleIsPlaying: () => void
  canPlay: boolean
  stop: () => void
}

const useIsPlaying = create<IUseIsPlaying>((set) => ({
  isPlaying: false,
  canPlay: (() => {
    const { duration } = useDuration.getState()
    const { excludedNotes } = useCountdown.getState()
    const allExcludedNotesAreChecked = excludedNotes.size > 10
    const isDurationValid = duration > 0
    const shouldCanPlay = !allExcludedNotesAreChecked && isDurationValid
    return shouldCanPlay
  })(),
  toggleIsPlaying: () =>
    set((state) => ({
      isPlaying: !state.isPlaying
    })),
  stop: () => {
    set({ isPlaying: false })
  }
}))

export default useIsPlaying
