import { useEffect, useRef, type CSSProperties } from 'react'
import { cn } from '@/lib/utils'
import { groupOf, METER_BY_ID, type Meter } from '@/music/meters'
import { NOTE_BY_ID } from '@/music/notes'
import { roundLength, usePractice } from '@/practice/store'

/** El carril: la vuelta que suena como una partitura, en filas de 4 compases. */
export function Lane() {
  const round = usePractice((state) => state.rounds[0])
  const next = usePractice((state) => state.rounds[1])
  const bar = usePractice((state) => state.position?.bar)
  const beat = usePractice((state) => state.position?.beat ?? 0)
  const bpm = usePractice((state) => state.bpm)
  const list = useRef<HTMLOListElement>(null)

  // en la cuenta de entrada (compás 0) todavía no hay compás actual
  const currentIndex = round && bar !== undefined ? bar - round.firstBar : -1
  const row = Math.floor(Math.max(currentIndex, 0) / 4)
  const length = round ? roundLength(round) : 0

  // lleva a la vista la fila siguiente, y con ella la actual, que queda justo arriba
  useEffect(() => {
    const target = list.current?.children[Math.min(length - 1, (row + 1) * 4)]
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    target?.scrollIntoView?.({
      block: 'nearest',
      behavior: reduce?.matches ? 'auto' : 'smooth'
    })
  }, [row, length, round?.number])

  if (!round) return null
  const meter = METER_BY_ID[round.meter]

  return (
    <div className="max-h-[34dvh] shrink-0 overflow-y-auto px-2 pb-2">
      <ol
        ref={list}
        aria-label="Carril"
        className="mx-auto grid max-w-3xl grid-cols-4 gap-y-3"
      >
        {Array.from({ length }, (_, i) => {
          const note =
            NOTE_BY_ID[round.notes[Math.floor(i / round.barsPerNote)]]
          const state =
            i < currentIndex
              ? 'played'
              : i === currentIndex
                ? 'current'
                : Math.floor(i / 4) <= row + 1
                  ? 'near'
                  : 'far'
          const current = state === 'current'
          return (
            <li
              key={i}
              aria-current={current ? 'true' : undefined}
              data-state={state}
              className={cn(
                'relative flex flex-col items-center gap-2 overflow-hidden border-l-2 border-foreground/30 pt-3 pb-4 transition-opacity',
                (i % 4 === 3 || i === length - 1) && 'border-r-2',
                current && 'bg-primary text-primary-foreground',
                state === 'played' && 'opacity-25',
                state === 'far' && 'opacity-40'
              )}
            >
              <span className="note-label font-black [--note-size:1.875rem] sm:[--note-size:2.25rem]">
                {note.label}
              </span>
              <BeatSlashes meter={meter} beat={current ? beat : undefined} />
              {current && (
                <span
                  key={beat}
                  aria-hidden
                  className="beat-progress absolute inset-x-0 bottom-0 h-1 bg-primary-foreground/70"
                  style={
                    {
                      '--from': beat / meter.beats,
                      '--to': (beat + 1) / meter.beats,
                      '--beat': `${(meter.beatLength * 60) / bpm}s`
                    } as CSSProperties
                  }
                />
              )}
            </li>
          )
        })}
      </ol>
      {next && (
        <p className="mx-auto mt-4 max-w-3xl text-center text-xl font-bold text-muted-foreground">
          Vuelta {next.number}: {NOTE_BY_ID[next.notes[0]].label}
        </p>
      )}
    </div>
  )
}

/** Las barras oblicuas de ritmo de una partitura de jazz: una por grupo. En el compás actual, se iluminan hasta el grupo que suena. */
function BeatSlashes({ meter, beat }: { meter: Meter; beat?: number }) {
  const groups = meter.groups.length
  const lit = beat === undefined ? 0 : groupOf(meter, beat) + 1
  return (
    <span
      // un <img> no puede contener las marcas
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
      role="img"
      aria-label={lit ? `Tiempo ${lit} de ${groups}` : `${groups} tiempos`}
      className="flex gap-2.5"
    >
      {Array.from({ length: groups }, (_, slash) => (
        <span
          key={slash}
          className={cn(
            'h-3.5 w-[3px] rotate-[24deg] rounded-full bg-current',
            slash < lit ? 'opacity-100' : 'opacity-30'
          )}
        />
      ))}
    </span>
  )
}
