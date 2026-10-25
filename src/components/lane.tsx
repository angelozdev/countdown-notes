import { Fragment, useEffect, useRef, type CSSProperties } from 'react'
import { cn } from '@/lib/utils'
import { chordSymbol } from '@/music/chords'
import { groupOf, METER_BY_ID, type Meter } from '@/music/meters'
import type { RoundChord } from '@/music/progressions'
import { roundLength, usePractice } from '@/practice/store'

/** El carril: la vuelta que suena como una partitura, en filas de 4 compases. */
export function Lane() {
  const round = usePractice((state) => state.rounds[0])
  const next = usePractice((state) => state.rounds[1])
  const bar = usePractice((state) => state.position?.bar)
  const beat = usePractice((state) => state.position?.beat ?? 0)
  const bpm = usePractice((state) => state.bpm)
  const withChord = usePractice((state) => state.withChord)
  const chordType = usePractice((state) => state.chordType)
  const sounding = usePractice((state) => state.sounding?.chordType)
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
  // el compás que suena dice lo que suena; los demás, lo que hay en los ajustes
  const labelOf = (chord: RoundChord, isCurrent: boolean) => {
    const type = chord.type ?? (isCurrent ? sounding : withChord && chordType)
    return type ? chordSymbol(chord.root, type) : chord.root.label
  }

  return (
    <div className="max-h-[34dvh] shrink-0 overflow-y-auto px-2 pb-2">
      <ol
        ref={list}
        aria-label="Carril"
        className="mx-auto grid max-w-3xl grid-cols-4 gap-y-3"
      >
        {round.bars.map((chords, i) => {
          const state =
            i < currentIndex
              ? 'played'
              : i === currentIndex
                ? 'current'
                : Math.floor(i / 4) <= row + 1
                  ? 'near'
                  : 'far'
          const current = state === 'current'
          const labels = chords.map((chord) => labelOf(chord, current))
          // las mitades de un compás se leen juntas: comparten tamaño, el que le cabe a la más larga
          const rootChars = Math.max(
            ...chords.map(({ root }) => root.label.length)
          )
          const suffixChars = Math.max(
            ...labels.map(
              (label, j) => label.length - chords[j].root.label.length
            )
          )
          return (
            <li
              key={i}
              aria-current={current ? 'true' : undefined}
              data-state={state}
              className={cn(
                'relative flex flex-col items-center gap-2 overflow-hidden [container-type:inline-size] border-l-2 border-foreground/30 pt-3 pb-4 transition-opacity',
                (i % 4 === 3 || i === length - 1) && 'border-r-2',
                current && 'border-primary bg-primary text-primary-foreground',
                state === 'played' && 'opacity-25',
                state === 'far' && 'opacity-40'
              )}
            >
              {chords.length > 1 ? (
                // compás partido: cada parte, de ancho proporcional a sus golpes, ajusta su cifrado
                <span
                  className="my-auto flex w-full"
                  style={
                    {
                      '--root-chars': rootChars,
                      '--suffix-chars': suffixChars
                    } as CSSProperties
                  }
                >
                  {chords.map((chord, j) => (
                    <Fragment key={chord.at}>
                      {j > 0 && (
                        <span
                          aria-hidden
                          className="my-1 w-0.5 self-stretch rounded-full bg-current opacity-50"
                        />
                      )}
                      <span
                        // un <img> no puede contener las dos líneas; sin esto se lee "D m7"
                        // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
                        role="img"
                        aria-label={labels[j]}
                        data-at={chord.at}
                        style={{
                          flexGrow:
                            (chords[j + 1]?.at ?? meter.beats) - chord.at
                        }}
                        className="flex basis-0 justify-center [container-type:inline-size]"
                      >
                        <SplitLabel root={chord.root.label} label={labels[j]} />
                      </span>
                    </Fragment>
                  ))}
                </span>
              ) : (
                <span
                  className="note-label note-fit my-auto font-black [--note-max:1.875rem] sm:[--note-max:2.25rem]"
                  style={{ '--chars': labels[0].length } as CSSProperties}
                >
                  <span data-at={chords[0].at}>{labels[0]}</span>
                </span>
              )}
              <BeatSlashes meter={meter} beat={current ? beat : undefined} />
              {current && (
                <span
                  key={beat}
                  aria-hidden
                  className="beat-progress absolute inset-x-0 bottom-0 h-1.5 bg-primary-foreground/70"
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
          Vuelta {next.number}: {labelOf(next.bars[0][0], false)}
        </p>
      )}
    </div>
  )
}

/** El cifrado de una mitad de compás: la raíz arriba y el sufijo debajo, para que cada uno use todo el ancho de su mitad. */
export function SplitLabel({ root, label }: { root: string; label: string }) {
  const suffix = label.slice(root.length)
  return (
    <span className="flex flex-col items-center gap-0.5 font-black [--note-max:1.875rem] sm:[--note-max:2.25rem]">
      <span className="note-label split-root">{root}</span>
      {suffix && <span className="split-suffix">{suffix}</span>}
    </span>
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
      className="flex gap-2"
    >
      {Array.from({ length: groups }, (_, slash) => (
        <span
          key={slash}
          className={cn(
            'h-5 w-1 rotate-[24deg] rounded-full bg-current',
            // el grupo que suena, más alto y entero; los ya sonados, más tenues
            slash === lit - 1
              ? 'scale-y-125 opacity-100'
              : slash < lit
                ? 'opacity-60'
                : 'opacity-30'
          )}
        />
      ))}
    </span>
  )
}
