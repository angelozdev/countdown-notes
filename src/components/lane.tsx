import { NOTE_BY_ID } from '@/music/notes'
import { roundLength, usePractice } from '@/practice/store'

/** El carril: la vuelta que suena en filas de 4 compases, y la primera nota de la siguiente. */
export function Lane() {
  const round = usePractice((state) => state.rounds[0])
  const next = usePractice((state) => state.rounds[1])
  const bar = usePractice((state) => state.position?.bar)
  if (!round) return null

  // en la cuenta de entrada (compás 0) todavía no hay compás actual
  const currentIndex = bar === undefined ? -1 : bar - round.firstBar
  const lastNearRow = Math.floor(Math.max(currentIndex, 0) / 4) + 1

  return (
    <div className="min-h-0 overflow-y-auto px-4 pb-2">
      <ol
        aria-label="Carril"
        className="mx-auto grid max-w-3xl grid-cols-4 gap-2"
      >
        {Array.from({ length: roundLength(round) }, (_, i) => {
          const note =
            NOTE_BY_ID[round.notes[Math.floor(i / round.barsPerNote)]]
          const state =
            i < currentIndex
              ? 'played'
              : i === currentIndex
                ? 'current'
                : Math.floor(i / 4) <= lastNearRow
                  ? 'near'
                  : 'far'
          return (
            <li
              key={i}
              aria-current={state === 'current' ? 'true' : undefined}
              data-state={state}
              className="rounded-lg border border-border py-3 text-center text-3xl font-black data-[state=current]:border-primary data-[state=current]:bg-primary data-[state=current]:text-primary-foreground data-[state=far]:opacity-40 data-[state=played]:opacity-30"
            >
              {note.label}
            </li>
          )
        })}
      </ol>
      {next && (
        <p className="mx-auto mt-3 max-w-3xl text-center text-xl font-semibold text-muted-foreground">
          Vuelta {next.number}: {NOTE_BY_ID[next.notes[0]].label}
        </p>
      )}
    </div>
  )
}
