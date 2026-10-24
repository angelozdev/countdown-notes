import { NOTE_BY_ID } from '@/music/notes'
import { nowPlaying, usePractice } from '@/practice/store'

/** "Ahora": la nota que suena, lo más grande posible, con su nombre en español. */
export function Now() {
  const stopped = usePractice((state) => state.status === 'stopped')
  const id = usePractice((state) => {
    const now = nowPlaying(state)
    return now && now.round.notes[now.index]
  })
  const note = id && NOTE_BY_ID[id]
  const countdown = usePractice((state) =>
    state.status === 'countIn' ? 4 - (state.position?.beat ?? 0) : undefined
  )

  return (
    <section
      aria-label="Ahora"
      className="flex flex-1 flex-col items-center justify-center gap-2 text-center"
    >
      {countdown !== undefined && (
        <p className="font-heading text-[min(32vw,38dvh)] leading-none font-black text-primary tabular-nums">
          {countdown}
        </p>
      )}
      {note && (
        <>
          <p className="font-heading text-[min(32vw,38dvh)] leading-none font-black tracking-tight">
            {note.label}
          </p>
          <p className="text-3xl font-semibold text-muted-foreground sm:text-4xl">
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
