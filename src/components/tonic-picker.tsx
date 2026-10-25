import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { NOTES, type NoteId } from '@/music/notes'
import { type Progression, tonicOf } from '@/music/progressions'

/** Una opción de un grupo de botones: grande, y en ámbar cuando está elegida. */
export const PICKED_ITEM =
  'h-12 text-lg font-bold data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground'

/** Las 12 tónicas, escritas como las escribe `progression`. */
export function TonicPicker({
  label,
  progression,
  value,
  onChange
}: {
  label: string
  progression: Progression
  value: NoteId
  onChange: (tonic: NoteId) => void
}) {
  return (
    <ToggleGroup
      type="single"
      aria-label={label}
      variant="outline"
      size="lg"
      className="grid w-full grid-cols-6"
      value={value}
      onValueChange={(tonic) => tonic && onChange(tonic as NoteId)}
    >
      {NOTES.map(({ id }) => {
        const { name, label } = tonicOf(progression, id)
        return (
          <ToggleGroupItem
            key={id}
            value={id}
            aria-label={name}
            className={PICKED_ITEM}
          >
            <span className="note-label [--note-size:1.25rem]">{label}</span>
          </ToggleGroupItem>
        )
      })}
    </ToggleGroup>
  )
}
