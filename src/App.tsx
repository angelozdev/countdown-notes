import React from 'react'
import { Wrapper, Counter, Input, Select } from './components'
import { noteList, TNotes } from './constants/notes'
import { useCountdown, Units } from './stores'

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
  const {
    duration,
    updateDuration,
    unit,
    updateUnit,
    xorExcludedNote,
    excludedNotes
  } = useCountdown(
    ({
      duration,
      updateDuration,
      unit,
      updateUnit,
      xorExcludedNote,
      excludedNotes
    }) => ({
      duration,
      updateDuration,
      unit,
      updateUnit,
      xorExcludedNote,
      excludedNotes
    })
  )

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

  const handleExludedNotesChange = (event: InputEvent) => {
    const { value } = event.target
    xorExcludedNote(value as TNotes)
  }

  return (
    <Wrapper>
      <div className="flex flex-col justify-center py-4">
        <div className="mb-8">
          <Input
            value={duration || ''}
            onChange={handleDurationChange}
            type="number"
            name="duration"
          />
          <Select items={units} value={unit} onChange={handleUnitChange} />

          <div className="mt-4">
            <h2>Exclude: </h2>
            <ul className="flex gap-2 flex-wrap">
              {noteList.map((note) => (
                <li key={note} className="rounded-lg border">
                  <label className="cursor-pointer py-1 px-3 flex gap-2 items-center">
                    <input
                      type="checkbox"
                      onChange={handleExludedNotesChange}
                      checked={excludedNotes.has(note)}
                      value={note}
                    />
                    <span>{note}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <Counter />
      </div>
    </Wrapper>
  )
}

export default App
