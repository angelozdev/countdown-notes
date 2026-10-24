import { Settings } from 'lucide-react'
import { Stepper } from '@/components/stepper'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet'
import { usePractice } from '@/practice/store'

export function SettingsPanel() {
  const bpm = usePractice((state) => state.bpm)
  const setBpm = usePractice((state) => state.setBpm)
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="secondary"
          size="lg"
          className="h-14 rounded-full px-5 text-base"
        >
          <Settings aria-hidden />
          Ajustes
        </Button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="mx-auto max-h-[85dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl pb-[env(safe-area-inset-bottom)]"
      >
        <SheetHeader>
          <SheetTitle className="text-xl">Ajustes</SheetTitle>
          <SheetDescription>El tempo cambia al instante.</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-6 px-4 pb-6">
          <Stepper
            label="BPM"
            min={30}
            max={240}
            value={bpm}
            onChange={setBpm}
            decreaseLabel="Bajar BPM"
            increaseLabel="Subir BPM"
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}
