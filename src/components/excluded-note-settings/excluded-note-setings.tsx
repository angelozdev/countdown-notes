import { noteList, TNotes } from '../../constants/notes'
import { useExcludedNotes } from '../../stores'

interface ExcludedNoteItemProps {
  value: TNotes
  checked: boolean
  onChange: () => void
}

function ExcludedNoteSettings() {
  const { xorExcludedNote, excludedNotes } = useExcludedNotes(
    ({ xorExcludedNote, excludedNotes }) => ({
      xorExcludedNote,
      excludedNotes
    })
  )

  return (
    <details open={false} className="mb-8">
      <summary className="mb-4 cursor-pointer">
        <h2 className="font-semibold inline">Exclude notes: </h2>
      </summary>

      <ul className="flex gap-4 flex-wrap justify-center">
        {noteList.map((note) => (
          <ExcludedNoteItem
            value={note}
            key={note}
            checked={excludedNotes.has(note)}
            onChange={() => xorExcludedNote(note)}
          />
        ))}
      </ul>
    </details>
  )
}

function ExcludedNoteItem({ onChange, checked, value }: ExcludedNoteItemProps) {
  return (
    <li className="rounded-lg border basis-24">
      <label className="cursor-pointer py-1 px-3 flex gap-2 items-center">
        <input
          type="checkbox"
          onChange={onChange}
          checked={checked}
          value={value}
        />
        <span>{value}</span>
      </label>
    </li>
  )
}

export default ExcludedNoteSettings
