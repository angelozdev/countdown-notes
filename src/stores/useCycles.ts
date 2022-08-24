import create from 'zustand'

interface IUseCycles {
  cycles: number
  reset: () => void
  increase: () => void
}

const useCycles = create<IUseCycles>((set) => ({
  cycles: 0,
  reset: () => {
    set({ cycles: 0 })
  },
  increase: () => {
    set((state) => ({ cycles: state.cycles + 1 }))
  }
}))

export default useCycles
