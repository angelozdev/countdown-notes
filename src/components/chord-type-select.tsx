import { ChevronDown } from 'lucide-react'
import { CHORD_TYPES, type ChordTypeId, chordSymbol } from '@/music/chords'

/** Un `<select>` con el aspecto de los botones del panel; la flecha va aparte, encima. */
export const SELECT =
  'h-12 w-full appearance-none truncate rounded-lg border border-input bg-transparent pr-11 pl-3 text-lg font-bold transition-all outline-none hover:bg-muted focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50'

/** Las familias de los acordes, en el orden de la tabla. */
const FAMILIES = [...new Set(CHORD_TYPES.map(({ family }) => family))]

/** Los tipos de acorde por familia, escritos sobre Do. */
export function ChordTypeSelect({
  value,
  onChange
}: {
  value: ChordTypeId
  onChange: (type: ChordTypeId) => void
}) {
  return (
    <div className="relative">
      <select
        aria-label="Tipo de acorde"
        className={SELECT}
        value={value}
        onChange={(event) => onChange(event.target.value as ChordTypeId)}
      >
        {FAMILIES.map((family) => (
          <optgroup key={family} label={family}>
            {CHORD_TYPES.filter((type) => type.family === family).map(
              ({ id, name }) => (
                <option key={id} value={id}>
                  {chordSymbol('C', id)} · {name}
                </option>
              )
            )}
          </optgroup>
        ))}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-4 size-5 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  )
}
