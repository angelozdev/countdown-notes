import React from 'react'
import { CountdownCircleTimer, OnComplete } from 'react-countdown-circle-timer'
import { useCountdown } from '../../stores'
import { Queue } from '../../utils'
import Display from './display'
import {
  getColorList,
  getTimeListByDuration,
  getDurationByUnit,
  getShuffleNoteList
} from './utils'

function Counter() {
  const { excludedNotes, duration, toggleIsPlaying, isPlaying, canPlay } =
    useCountdown(
      ({
        excludedNotes,
        duration,
        toggleIsPlaying,
        isPlaying,
        getCanPlayState,
        unit
      }) => ({
        canPlay: getCanPlayState(),
        duration: getDurationByUnit(duration, unit),
        excludedNotes,
        isPlaying,
        toggleIsPlaying
      })
    )

  const { current: noteQueue } = React.useRef(
    new Queue(getShuffleNoteList(excludedNotes))
  )
  const [currentNote, setCurrentNote] = React.useState(
    () => noteQueue.dequeue()!
  )
  const nextNote = noteQueue.peek!

  const onComplete = (): OnComplete => {
    setCurrentNote(noteQueue.dequeue()!)
    if (noteQueue.isEmpty)
      noteQueue.enqueuGroup(getShuffleNoteList(excludedNotes))
    return { shouldRepeat: true }
  }

  React.useEffect(() => {
    noteQueue.empty()
    noteQueue.enqueuGroup(getShuffleNoteList(excludedNotes))
    setCurrentNote(noteQueue.dequeue()!)
  }, [excludedNotes.size])

  return (
    <button disabled={!canPlay} onClick={toggleIsPlaying}>
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
