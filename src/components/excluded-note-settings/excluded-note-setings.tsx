import { noteList, TNotes } from '../../constants/notes'
import { useExcludedNotes } from '../../stores'
import { Button } from '../button'

interface ExcludedNoteItemProps {
  value: TNotes
  checked: boolean
  onChange: () => void
}

function ExcludedNoteSettings() {
  const {
    xorExcludedNote,
    excludedNotes,
    isAllChecked,
    selectAll,
    removeAll,
    removeAllSharps,
    selectAllSharps,
    removeAllNaturals,
    selectAllNaturals
  } = useExcludedNotes(({ excludedNotes, ...restProps }) => {
    const isAllChecked = excludedNotes.size === noteList.length
    return {
      excludedNotes,
      isAllChecked,
      ...restProps
    }
  })

  return (
    <details open={false} className="mb-8">
      <summary className="mb-4 cursor-pointer">
        <h2 className="font-semibold inline">Exclude notes: </h2>
      </summary>

      <div>
        <div className="flex flex-wrap gap-2">
          <Button disabled={isAllChecked} onClick={selectAll}>
            Select all
          </Button>

          <Button
            disabled={excludedNotes.size === NodeList.length}
            onClick={removeAll}
          >
            Remove all
          </Button>

          <Button onClick={selectAllSharps}>Select all sharps</Button>
          <Button onClick={removeAllSharps}>Remove all sharps</Button>

          <Button onClick={selectAllNaturals}>Select all naturals</Button>
          <Button onClick={removeAllNaturals}>Remove all naturals</Button>
        </div>

        <ul className="flex gap-4 flex-wrap justify-center px-2 py-3 border mt-4">
          {noteList.map((note) => (
            <ExcludedNoteItem
              value={note}
              key={note}
              checked={excludedNotes.has(note)}
              onChange={() => xorExcludedNote(note)}
            />
          ))}
        </ul>
      </div>
    </details>
  )
}

function ExcludedNoteItem({ onChange, checked, value }: ExcludedNoteItemProps) {
  return (
    <li className="rounded border basis-24">
      <label className="cursor-pointer py-2 px-4 flex gap-2 items-center">
        <input
          type="checkbox"
          onChange={onChange}
          checked={checked}
          value={value}
          className="cursor-pointer accent-green-700"
        />
        <span>{value}</span>
      </label>
    </li>
  )
}

export default ExcludedNoteSettings
