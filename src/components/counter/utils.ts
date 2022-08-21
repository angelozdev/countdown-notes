import { noteList, TNotes } from '../../constants/notes'
import { Queue, shuffle } from '../../utils'

type HexColor = `#${string}`

const colorsByPercentage: Record<number, HexColor> = {
  0: '#004777',
  16: '#00BFFF',
  33: '#00FF7F',
  50: '#FFFF00',
  66: '#FFD700',
  83: '#FFA500',
  100: '#FF4500'
}

export function getColorList(): HexColor[] {
  const colors = Object.values(colorsByPercentage)
  return colors
}

export function getTimeListByDuration(duration: number): number[] {
  const percentageList = Object.keys(colorsByPercentage).map(Number)
  const values = percentageList
    .map((percentage) => +((percentage / 100) * (duration - 1)).toFixed(3))
    .sort((a, b) => b - a)

  return values
}

export function getNotesQueue(excludedNotes: Set<TNotes>) {
  const unorderedNoteList = shuffle(noteList)
  const notes = unorderedNoteList.filter((note) => !excludedNotes.has(note))
  const queue = new Queue(notes)
  return queue
}

const rtf = new Intl.RelativeTimeFormat('en', {
  numeric: 'auto'
})

export function formatRelativeTime(time: number) {
  return rtf.format(time, 'seconds')
}
