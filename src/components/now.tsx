import { NOTE_BY_ID } from '@/music/notes'
import { groupOf } from '@/music/meters'
import { meterOf, nowPlaying, usePractice } from '@/practice/store'

/** "Ahora": la nota que suena, lo más grande que quepa, con su nombre en español. */
export function Now() {
  const stopped = usePractice((state) => state.status === 'stopped')
  const id = usePractice((state) => {
    const now = nowPlaying(state)
    return now && now.round.notes[now.index]
  })
  const note = id && NOTE_BY_ID[id]
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
          <p className="note-label font-heading font-black tracking-tight [--note-size:min(66cqh,46cqw)]">
            {note.label}
          </p>
          <p className="text-[clamp(1.5rem,10cqh,3rem)] leading-none font-semibold text-muted-foreground">
            {note.name}
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
