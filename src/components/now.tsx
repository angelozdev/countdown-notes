import type { CSSProperties } from 'react'
import { chordName, chordSymbol } from '@/music/chords'
import { groupOf } from '@/music/meters'
import { chordAt, meterOf, nowPlaying, usePractice } from '@/practice/store'

/** "Ahora": la nota que suena, lo más grande que quepa, con su nombre en español. */
export function Now() {
  const stopped = usePractice((state) => state.status === 'stopped')
  const chord = usePractice((state) => {
    const now = nowPlaying(state)
    return (
      now &&
      state.position &&
      chordAt(now.round.bars[now.index], state.position.beat)
    )
  })
  const sounding = usePractice((state) => state.sounding?.chordType)
  const note = chord?.root
  const chordType = chord && (chord.type ?? sounding)
  const symbol = note
    ? chordType
      ? chordSymbol(note, chordType)
      : note.label
    : ''
  const countdown = usePractice((state) => {
    if (state.status !== 'countIn') return undefined
    const meter = meterOf(state)
    const group = state.position ? groupOf(meter, state.position.beat) : 0
    return meter.groups.length - group
  })

  return (
    <section
      aria-label="Ahora"
      className="flex min-h-0 flex-1 flex-col items-center justify-center gap-[3cqh] text-center [container-type:size]"
    >
      {countdown !== undefined && (
        <p className="font-heading text-[min(72cqh,60cqw)] leading-none font-black text-primary tabular-nums">
          {countdown}
        </p>
      )}
      {note && (
        <>
          <p
            className="note-label note-fit font-heading font-black [--note-max:min(66cqh,46cqw)]"
            style={{ '--chars': symbol.length } as CSSProperties}
          >
            {symbol}
          </p>
          <p className="text-[clamp(1.5rem,10cqh,3rem)] leading-none font-semibold text-balance text-muted-foreground">
            {chordType ? chordName(note, chordType) : note.name}
          </p>
        </>
      )}
      {stopped && (
        <p className="text-2xl text-muted-foreground">
          Toca Play para empezar.
        </p>
      )}
    </section>
  )
}
