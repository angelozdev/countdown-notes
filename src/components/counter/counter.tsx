import React from 'react'
import { CountdownCircleTimer, OnComplete } from 'react-countdown-circle-timer'
import { TNotes } from '../../constants/notes'
import { useToggle } from '../../hooks'
import Display from './display'
import { getColorList, getTimeListByDuration, getNotesQueue } from './utils'

type Props = {
  duration: number
  excludedNotes: Set<TNotes>
}

function Counter({ duration, excludedNotes }: Props) {
  const [isPlaying, toggleIsPlaying] = useToggle(false)
  const [noteList, setNoteList] = React.useState(() =>
    getNotesQueue(excludedNotes)
  )
  const [currentNote, setCurrentNote] = React.useState(
    () => noteList.dequeue()!
  )

  const nextNote = React.useMemo(() => {
    const nextNote = noteList.dequeue()!
    if (noteList.isEmpty) setNoteList(() => getNotesQueue(excludedNotes))
    return nextNote
  }, [currentNote])

  const onComplete = (): OnComplete => {
    setCurrentNote(nextNote)
    return { shouldRepeat: true }
  }

  React.useEffect(() => {
    setNoteList(() => getNotesQueue(excludedNotes))
  }, [excludedNotes])

  return (
    <button onClick={toggleIsPlaying}>
      <span className="inline-block mb-4">{isPlaying ? '🎵' : '᭸'}</span>
      <div className="flex justify-center">
        <CountdownCircleTimer
          colors={getColorList() as any}
          colorsTime={getTimeListByDuration(duration) as any}
          duration={duration}
          isPlaying={isPlaying}
          onComplete={onComplete}
          size={200}
        >
          {({ remainingTime, color }) => (
            <Display
              color={color}
              currentNote={currentNote}
              nextNote={nextNote}
              remainingTime={remainingTime}
            />
          )}
        </CountdownCircleTimer>
      </div>
    </button>
  )
}

export default Counter
