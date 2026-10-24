import { Play, Square } from 'lucide-react'
import { useState } from 'react'
import type { Engine } from '@/audio/engine'
import { Button } from '@/components/ui/button'
import {
  createPracticeStore,
  PracticeContext,
  usePractice
} from '@/practice/store'

export default function App({ engine }: { engine: Engine }) {
  const [store] = useState(() => createPracticeStore(engine))
  return (
    <PracticeContext value={store}>
      <main className="flex min-h-dvh flex-col p-safe">
        <h1 className="sr-only">Countdown Notes</h1>
        <div className="flex-1" />
        <footer className="flex justify-center p-6">
          <PlayButton />
        </footer>
      </main>
    </PracticeContext>
  )
}

function PlayButton() {
  const stopped = usePractice((state) => state.status === 'stopped')
  const play = usePractice((state) => state.play)
  const stop = usePractice((state) => state.stop)
  return (
    <Button
      size="lg"
      className="h-16 min-w-40 rounded-full text-xl font-bold"
      onClick={stopped ? play : stop}
    >
      {stopped ? <Play aria-hidden /> : <Square aria-hidden />}
      {stopped ? 'Play' : 'Stop'}
    </Button>
  )
}
