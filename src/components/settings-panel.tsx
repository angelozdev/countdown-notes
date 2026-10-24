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
import { Toggle } from '@/components/ui/toggle'
import { NOTES } from '@/music/notes'
import { NOT_ENOUGH_NOTES, usePractice } from '@/practice/store'

export function SettingsPanel() {
  const bpm = usePractice((state) => state.bpm)
  const setBpm = usePractice((state) => state.setBpm)
  const barsPerNote = usePractice((state) => state.barsPerNote)
  const setBarsPerNote = usePractice((state) => state.setBarsPerNote)
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
          <SheetDescription>
            El tempo cambia al instante; lo demás, desde la siguiente vuelta.
          </SheetDescription>
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
          <div className="flex flex-col gap-1">
            <Stepper
              label="Compases por nota"
              min={1}
              max={16}
              value={barsPerNote}
              onChange={setBarsPerNote}
              decreaseLabel="Bajar compases por nota"
              increaseLabel="Subir compases por nota"
            />
            <p className="text-sm text-muted-foreground">
              Se aplica desde la siguiente vuelta.
            </p>
          </div>
          <NoteFilters />
        </div>
      </SheetContent>
    </Sheet>
  )
}

function NoteFilters() {
  const notes = usePractice((state) => state.notes)
  const toggleNote = usePractice((state) => state.toggleNote)
  const setGroup = usePractice((state) => state.setGroup)
  const group = (natural: boolean) =>
    NOTES.filter((note) => note.natural === natural)
  const allIn = (natural: boolean) =>
    group(natural).every((note) => notes.includes(note.id))
  const allOut = (natural: boolean) =>
    group(natural).every((note) => !notes.includes(note.id))
  const shortcuts = [
    { label: 'Incluir naturales', natural: true, included: true },
    { label: 'Excluir naturales', natural: true, included: false },
    { label: 'Incluir alteradas', natural: false, included: true },
    { label: 'Excluir alteradas', natural: false, included: false }
  ]

  return (
    <section className="flex flex-col gap-3">
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 text-base font-semibold">Notas</legend>
        <div className="grid grid-cols-6 gap-2">
          {NOTES.map((note) => (
            <Toggle
              key={note.id}
              variant="outline"
              size="lg"
              className="h-12 text-lg font-bold data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
              pressed={notes.includes(note.id)}
              onPressedChange={() => toggleNote(note.id)}
            >
              {note.label}
            </Toggle>
          ))}
        </div>
      </fieldset>
      <div className="grid grid-cols-2 gap-2">
        {shortcuts.map(({ label, natural, included }) => (
          <Button
            key={label}
            variant="secondary"
            className="h-11"
            disabled={included ? allIn(natural) : allOut(natural)}
            onClick={() => setGroup(natural, included)}
          >
            {label}
          </Button>
        ))}
      </div>
      {notes.length < 2 && (
        <p className="text-sm font-medium text-primary">{NOT_ENOUGH_NOTES}</p>
      )}
      <p className="text-sm text-muted-foreground">
        Se aplica desde la siguiente vuelta.
      </p>
    </section>
  )
}
