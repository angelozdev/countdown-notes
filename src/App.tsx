import React from 'react'
import { Wrapper, Counter, Input, Select } from './components'
import { noteList, TNotes } from './constants/notes'

type InputEvent = React.ChangeEvent<HTMLInputElement>
type SelectEvent = React.ChangeEvent<HTMLSelectElement>
type TUnits = 'seconds' | 'minutes' | 'hours'
type Unit = {
  value: TUnits
  label: string
}
const MIN_DURATION = 5
const units: Unit[] = [
  {
    label: 'Seconds',
    value: 'seconds'
  },
  {
    label: 'Minutes',
    value: 'minutes'
  },
  {
    label: 'Hours',
    value: 'hours'
  }
]

function getDurationByUnit(unit: TUnits, value: number) {
  const durations = {
    seconds: value,
    minutes: value * 60,
    hours: value * 60 * 60
  }

  return durations[unit] ?? durations.seconds
}

function App() {
  const [duration, setDuration] = React.useState(15)
  const [unit, setUnit] = React.useState<TUnits>('seconds')
  const [exludedNotes, setExludedNotes] = React.useState<Set<TNotes>>(
    new Set(['C'])
  )

  const handleDurationChange = (event: InputEvent) => {
    const { valueAsNumber = 0 } = event.target
    const durationInSeconds = getDurationByUnit(unit, valueAsNumber)
    if (isNaN(valueAsNumber) || durationInSeconds < MIN_DURATION) {
      return setDuration(MIN_DURATION)
    }
    setDuration(valueAsNumber)
  }

  const handleUnitChange = (event: SelectEvent) => {
    const { value } = event.target
    setUnit(value as TUnits)
  }

  const handleExludedNotesChange = (event: InputEvent) => {
    const { value, checked } = event.target
    if (checked) {
      return setExludedNotes(
        (exludedNotes) => new Set([...exludedNotes, value as TNotes])
      )
    }

    setExludedNotes(
      (exludedNotes) =>
        new Set([...exludedNotes].filter((note) => note !== value))
    )
  }

  return (
    <Wrapper>
      <div className="flex flex-col justify-center py-4">
        <div className="mb-8">
          <Input
            value={duration}
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
                      checked={exludedNotes.has(note)}
                      value={note}
                    />
                    <span>{note}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <Counter
          excludedNotes={exludedNotes}
          duration={getDurationByUnit(unit, duration)}
        />
      </div>
    </Wrapper>
  )
}

export default App
