import create from 'zustand'
import useDuration from './useDuration'
import useCountdown from './useExcludeNotes'

interface IUseIsPlaying {
  isPlaying: boolean
  toggleIsPlaying: () => void
  stop: () => void
}

const useIsPlaying = create<IUseIsPlaying>((set) => ({
  isPlaying: false,
  toggleIsPlaying: () =>
    set((state) => ({
      isPlaying: !state.isPlaying
    })),
  stop: () => {
    set({ isPlaying: false })
  }
}))

export default useIsPlaying
