import create from 'zustand'
import useIsPlaying from './useIsPlaying'

interface IUseDuration {
  duration: number
  updateDuration: (duration: number) => void
}

const useDuration = create<IUseDuration>((set) => ({
  duration: 5,
  updateDuration: (duration: number) => {
    if (duration === 0) useIsPlaying.setState({ isPlaying: false })
    set({ duration })
  }
}))

export default useDuration
