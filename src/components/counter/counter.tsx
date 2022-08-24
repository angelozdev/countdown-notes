import React from 'react'
import { CountdownCircleTimer, OnComplete } from 'react-countdown-circle-timer'
import {
  useExcludedNotes,
  useDuration,
  useUnit,
  useIsPlaying,
  useCycles
} from '../../stores'
import { Queue } from '../../utils'
import Display from './display'
import {
  getColorList,
  getTimeListByDuration,
  getDurationByUnit,
  getShuffleNoteList
} from './utils'

function Counter() {
  const { duration } = useDuration()
  const { unit } = useUnit()
  const { cycles, increase, reset } = useCycles()
  const { excludedNotes } = useExcludedNotes(({ excludedNotes }) => ({
    excludedNotes
  }))
  const { isPlaying, toggleIsPlaying, canPlay } = useIsPlaying()

  const { current: noteQueue } = React.useRef(
    new Queue(getShuffleNoteList(excludedNotes))
  )
  const [currentNote, setCurrentNote] = React.useState(
    () => noteQueue.dequeue()!
  )
  const nextNote = noteQueue.peek!

  const onComplete = (): OnComplete => {
    setCurrentNote(noteQueue.dequeue()!)
    if (noteQueue.isEmpty) {
      noteQueue.enqueuGroup(getShuffleNoteList(excludedNotes))
      increase()
    }
    return { shouldRepeat: true }
  }

  React.useEffect(() => {
    noteQueue.empty()
    noteQueue.enqueuGroup(getShuffleNoteList(excludedNotes))
    setCurrentNote(noteQueue.dequeue()!)
    reset()
  }, [excludedNotes.size])

  return (
    <button disabled={!canPlay} onClick={toggleIsPlaying}>
      <span className="inline-block mb-4">{isPlaying ? '🎵' : '᭸'}</span>
      <div className="flex justify-center">
        <CountdownCircleTimer
          colors={getColorList() as any}
          colorsTime={getTimeListByDuration(duration) as any}
          duration={getDurationByUnit(duration, unit)}
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

      <div className="mt-4">
        <p className="text-stone-600">{cycles}</p>
      </div>
    </button>
  )
}

export default Counter
