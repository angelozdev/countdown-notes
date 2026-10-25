import { Minus, Play, Plus, Square } from 'lucide-react'
import { useCallback, useContext, useState } from 'react'
import type { Engine } from '@/audio/engine'
import { Lane } from '@/components/lane'
import { Now } from '@/components/now'
import { SettingsPanel } from '@/components/settings-panel'
import { Button } from '@/components/ui/button'
import { useSpaceToggle, useWakeLock } from '@/lib/hands-free'
import {
  canPlay,
  createPracticeStore,
  meterOf,
  NOT_ENOUGH_NOTES,
  nowPlaying,
  PracticeContext,
  STYLE_LABELS,
  usePractice
} from '@/practice/store'

export default function App({ engine }: { engine: Engine }) {
  const [store] = useState(() => createPracticeStore(engine))
  return (
    <PracticeContext value={store}>
      <HandsFree />
      <main className="flex h-dvh flex-col p-safe">
        <h1 className="sr-only">Countdown Notes</h1>
        <StatusLine />
        <Now />
        <Lane />
        <footer className="flex flex-col items-center gap-3 pt-4">
          <Counter />
          <NotEnoughNotes />
          <div className="flex w-full max-w-sm items-center gap-3">
            <QuickTempo delta={-5} />
            <PlayButton />
            <QuickTempo delta={5} />
          </div>
          <SettingsPanel />
        </footer>
      </main>
    </PracticeContext>
  )
}

/** Pantalla encendida y barra espaciadora; no dibuja nada. */
function HandsFree() {
  const store = useContext(PracticeContext)!
  useWakeLock(usePractice((state) => state.status !== 'stopped'))
  useSpaceToggle(
    useCallback(() => {
      const { status, play, stop } = store.getState()
      if (status === 'stopped') play()
      else stop()
    }, [store])
  )
  return null
}

function StatusLine() {
  const bpm = usePractice((state) => state.bpm)
  const meter = usePractice((state) => meterOf(state).id)
  const style = usePractice((state) =>
    state.status !== 'stopped'
      ? (state.sounding?.style ?? state.style)
      : state.style
  )
  return (
    <p className="p-2 text-center text-sm text-muted-foreground">
      Aleatorio · {STYLE_LABELS[style]} · {bpm} BPM · {meter}
    </p>
  )
}

function Counter() {
  const text = usePractice((state) => {
    const now = nowPlaying(state)
    const { on, count } = state.repeats
    return (
      now &&
      `Vuelta ${now.round.number}${on ? ` de ${count}` : ''} · nota ${Math.floor(now.index / now.round.barsPerNote) + 1} de ${now.round.notes.length}`
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
      className="h-16 min-w-0 flex-1 rounded-full text-xl font-bold"
      disabled={stopped && !playable}
      onClick={stopped ? play : stop}
    >
      {stopped ? <Play aria-hidden /> : <Square aria-hidden />}
      {stopped ? 'Play' : 'Stop'}
    </Button>
  )
}

/** Un botón de tempo rápido: ±5 BPM, el ajuste fino de a 1 vive en el panel. */
function QuickTempo({ delta }: { delta: -5 | 5 }) {
  const setBpm = usePractice((state) => state.setBpm)
  const bpm = usePractice((state) => state.bpm)
  const Icon = delta < 0 ? Minus : Plus
  return (
    <Button
      variant="secondary"
      size="icon-lg"
      className="size-14 shrink-0 rounded-full"
      aria-label={`${delta < 0 ? 'Bajar' : 'Subir'} 5 BPM`}
      onClick={() => setBpm(bpm + delta)}
    >
      <Icon aria-hidden />
    </Button>
  )
}
