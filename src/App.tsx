import React from 'react'
import {
  Wrapper,
  Counter,
  Input,
  Select,
  ExcludedNoteSettings,
  Button
} from './components'
import {
  Units,
  useDuration,
  useUnit,
  useCycles,
  useExcludedNotes,
  useIsPlaying
} from './stores'

type InputEvent = React.ChangeEvent<HTMLInputElement>
type SelectEvent = React.ChangeEvent<HTMLSelectElement>
type Unit = {
  value: Units
  label: string
}
const MIN_DURATION = 0
const units: Unit[] = [
  {
    label: 'Seconds',
    value: Units.SECONDS
  },
  {
    label: 'Minutes',
    value: Units.MINUTES
  },
  {
    label: 'Hours',
    value: Units.HOURS
  }
]

function getDurationByUnit(unit: Units, value: number) {
  const durations: Record<Units, number> = {
    [Units.SECONDS]: value,
    [Units.MINUTES]: value * 60,
    [Units.HOURS]: value * 60 * 60
  }

  return durations[unit] ?? durations.sec
}

function App() {
  const { duration, updateDuration } = useDuration()
  const { unit, updateUnit } = useUnit()
  const stop = useIsPlaying(({ stop }) => stop)
  const resetExcludedNotes = useExcludedNotes(({ removeAll }) => removeAll)
  const resetCycles = useCycles(({ reset }) => reset)

  const handleDurationChange = (event: InputEvent) => {
    const { valueAsNumber } = event.target
    const durationInSeconds = getDurationByUnit(unit, valueAsNumber)
    if (isNaN(valueAsNumber) || durationInSeconds < MIN_DURATION) {
      return updateDuration(0)
    }
    updateDuration(valueAsNumber)
  }

  const handleUnitChange = (event: SelectEvent) => {
    const { value } = event.target
    updateUnit(value as Units)
  }

  const handleReset = () => {
    resetCycles()
    updateUnit(Units.SECONDS)
    updateDuration(5)
    resetExcludedNotes()
    stop()
  }

  return (
    <Wrapper className="max-w-sm">
      <div className="flex flex-col justify-center py-4">
        <div className="mb-8 flex gap-2">
          <Input
            value={duration || ''}
            onChange={handleDurationChange}
            type="number"
            name="duration"
          />
          <Select
            className="w-full"
            items={units}
            value={unit}
            onChange={handleUnitChange}
          />
          <Button onClick={handleReset}>RESET</Button>
        </div>
        <ExcludedNoteSettings />
        <Counter />
      </div>
    </Wrapper>
  )
}

export default App
