import { Play, Square } from 'lucide-react'
import { useState } from 'react'
import type { Engine } from '@/audio/engine'
import { Lane } from '@/components/lane'
import { Now } from '@/components/now'
import { SettingsPanel } from '@/components/settings-panel'
import { Button } from '@/components/ui/button'
import {
  canPlay,
  createPracticeStore,
  NOT_ENOUGH_NOTES,
  nowPlaying,
  PracticeContext,
  usePractice
} from '@/practice/store'

export default function App({ engine }: { engine: Engine }) {
  const [store] = useState(() => createPracticeStore(engine))
  return (
    <PracticeContext value={store}>
      <main className="flex h-dvh flex-col p-safe">
        <h1 className="sr-only">Countdown Notes</h1>
        <StatusLine />
        <Now />
        <Lane />
        <footer className="flex flex-col items-center gap-3 p-6">
          <Counter />
          <NotEnoughNotes />
          <div className="flex items-center justify-center gap-4">
            <PlayButton />
            <SettingsPanel />
          </div>
        </footer>
      </main>
    </PracticeContext>
  )
}

function StatusLine() {
  const bpm = usePractice((state) => state.bpm)
  return (
    <p className="p-4 text-center text-sm tracking-wide text-muted-foreground">
      Aleatorio · Analógico cálido · {bpm} BPM · 4/4
    </p>
  )
}

function Counter() {
  const text = usePractice((state) => {
    const now = nowPlaying(state)
    return (
      now &&
      `Vuelta ${now.round.number} · nota ${now.index + 1} de ${now.round.notes.length}`
    )
  })
  return text ? (
    <p className="text-lg font-semibold text-muted-foreground tabular-nums">
      {text}
    </p>
  ) : null
}

function NotEnoughNotes() {
  const show = usePractice(
    (state) => state.status === 'stopped' && !canPlay(state)
  )
  return show ? (
    <p className="text-sm font-medium text-primary">{NOT_ENOUGH_NOTES}</p>
  ) : null
}

function PlayButton() {
  const stopped = usePractice((state) => state.status === 'stopped')
  const playable = usePractice(canPlay)
  const play = usePractice((state) => state.play)
  const stop = usePractice((state) => state.stop)
  return (
    <Button
      size="lg"
      className="h-16 min-w-40 rounded-full text-xl font-bold"
      disabled={stopped && !playable}
      onClick={stopped ? play : stop}
    >
      {stopped ? <Play aria-hidden /> : <Square aria-hidden />}
      {stopped ? 'Play' : 'Stop'}
    </Button>
  )
}
