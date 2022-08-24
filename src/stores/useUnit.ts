import create from 'zustand'

export enum Units {
  SECONDS = 'sec',
  MINUTES = 'min',
  HOURS = 'hrs'
}

interface IUseUnit {
  unit: Units
  updateUnit: (unit: Units) => void
}

const useUnit = create<IUseUnit>((set, get) => ({
  unit: Units.SECONDS,
  updateUnit: (unit: Units) => set({ unit })
}))

export default useUnit
