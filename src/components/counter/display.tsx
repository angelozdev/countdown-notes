import { TNotes } from '../../constants/notes'
import { formatRelativeTime } from './utils'

type Props = {
  currentNote: TNotes
  nextNote: TNotes
  remainingTime: number
  color: string
}

function Display({ currentNote, nextNote, remainingTime, color }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <small>{formatRelativeTime(remainingTime)}</small>
      <h1 style={{ color }} className="text-3xl font-bold">
        {currentNote}
      </h1>
      <p className="text-sm">{nextNote}</p>
    </div>
  )
}
export default Display
