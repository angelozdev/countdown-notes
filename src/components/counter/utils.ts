import { noteList, TNotes } from '../../constants/notes'
import { Units } from '../../stores'
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

export function getShuffleNoteList(excludedNotes?: Set<TNotes>) {
  return shuffle(noteList).filter((n) => !excludedNotes?.has(n))
}

const rtf = new Intl.RelativeTimeFormat('en', {
  numeric: 'auto'
})

export function formatRelativeTime(time: number) {
  return rtf.format(time, 'seconds')
}

export const getDurationByUnit = (duration: number, unit: Units): number =>
  ({
    [Units.SECONDS]: duration,
    [Units.MINUTES]: duration * 60,
    [Units.HOURS]: duration * 60 * 60
  }[unit])
