import { Settings, Volume2, VolumeX } from 'lucide-react'
import { type ReactNode, useId } from 'react'
import type { Channel } from '@/audio/engine'
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
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Toggle } from '@/components/ui/toggle'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { type BassFigure, METERS, type MeterId } from '@/music/meters'
import { NOTES } from '@/music/notes'
import { NOT_ENOUGH_NOTES, usePractice } from '@/practice/store'

/** Un grupo del panel: filete arriba y título; los controles grandes van debajo. */
const SECTION = 'flex flex-col gap-3 border-t border-border pt-5'
const HEADING = 'text-lg font-bold'
const CAPTION = 'text-sm text-muted-foreground'
/** Una opción de un grupo de botones: grande, y en ámbar cuando está elegida. */
const PICKED_ITEM =
  'h-12 text-lg font-bold data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={SECTION}>
      <h3 className={HEADING}>{title}</h3>
      {children}
    </section>
  )
}

export function SettingsPanel() {
  const bpm = usePractice((state) => state.bpm)
  const setBpm = usePractice((state) => state.setBpm)
  const barsPerNote = usePractice((state) => state.barsPerNote)
  const setBarsPerNote = usePractice((state) => state.setBarsPerNote)
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="lg"
          className="h-12 rounded-full px-5 text-base text-muted-foreground"
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
            El tempo y el volumen cambian al instante; el sonido, desde el
            siguiente compás; la estructura, desde la siguiente vuelta.
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-6 px-4 pb-6">
          <Section title="Tiempo">
            <Stepper
              label="BPM"
              min={30}
              max={240}
              value={bpm}
              onChange={setBpm}
              decreaseLabel="Bajar BPM"
              increaseLabel="Subir BPM"
            />
            <MeterPicker />
            <Stepper
              label="Compases por nota"
              min={1}
              max={16}
              value={barsPerNote}
              onChange={setBarsPerNote}
              decreaseLabel="Bajar compases por nota"
              increaseLabel="Subir compases por nota"
            />
          </Section>
          <BassPicker />
          <Volumes />
          <NoteFilters />
          <Repeats />
        </div>
      </SheetContent>
    </Sheet>
  )
}

function MeterPicker() {
  const meter = usePractice((state) => state.meter)
  const setMeter = usePractice((state) => state.setMeter)
  return (
    <div className="flex flex-col gap-3">
      <p className={CAPTION}>Compás</p>
      <ToggleGroup
        type="single"
        aria-label="Compás"
        variant="outline"
        size="lg"
        className="grid w-full grid-cols-4"
        value={meter}
        onValueChange={(value) => value && setMeter(value as MeterId)}
      >
        {METERS.map(({ id }) => (
          <ToggleGroupItem key={id} value={id} className={PICKED_ITEM}>
            {id}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}

const FIGURES: { id: BassFigure; label: string }[] = [
  { id: 'eighth', label: 'Corcheas' },
  { id: 'quarter', label: 'Negras' },
  { id: 'half', label: 'Blancas' },
  { id: 'whole', label: 'Redondas' }
]

const OCTAVES = [1, 2, 3] as const

function BassPicker() {
  const figure = usePractice((state) => state.bassFigure)
  const setFigure = usePractice((state) => state.setBassFigure)
  const octave = usePractice((state) => state.bassOctave)
  const setOctave = usePractice((state) => state.setBassOctave)
  return (
    <Section title="Bajo">
      <p className={CAPTION}>Figura</p>
      <ToggleGroup
        type="single"
        aria-label="Figura del bajo"
        variant="outline"
        size="lg"
        className="grid w-full grid-cols-2 sm:grid-cols-4"
        value={figure}
        onValueChange={(value) => value && setFigure(value as BassFigure)}
      >
        {FIGURES.map(({ id, label }) => (
          <ToggleGroupItem key={id} value={id} className={PICKED_ITEM}>
            {label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <p className={CAPTION}>Octava</p>
      <ToggleGroup
        type="single"
        aria-label="Octava del bajo"
        variant="outline"
        size="lg"
        className="grid w-full grid-cols-3"
        value={String(octave)}
        onValueChange={(value) =>
          value && setOctave(Number(value) as (typeof OCTAVES)[number])
        }
      >
        {OCTAVES.map((id) => (
          <ToggleGroupItem key={id} value={String(id)} className={PICKED_ITEM}>
            {id}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </Section>
  )
}

const CHANNELS: { id: Channel; label: string; slider: string; mute: string }[] =
  [
    {
      id: 'bass',
      label: 'Bajo',
      slider: 'Volumen del bajo',
      mute: 'Silenciar bajo'
    },
    {
      id: 'click',
      label: 'Metrónomo',
      slider: 'Volumen del metrónomo',
      mute: 'Silenciar metrónomo'
    }
  ]

function Volumes() {
  const mix = usePractice((state) => state.mix)
  const setVolume = usePractice((state) => state.setVolume)
  const toggleMute = usePractice((state) => state.toggleMute)
  return (
    <Section title="Volumen">
      {CHANNELS.map(({ id, label, slider, mute }) => (
        <div key={id} className="flex flex-col gap-2">
          <p className={CAPTION}>{label}</p>
          <div className="flex items-center gap-4">
            <Slider
              aria-label={slider}
              min={0}
              max={100}
              step={1}
              value={[mix[id].volume]}
              onValueChange={([volume]) => setVolume(id, volume)}
            />
            <Toggle
              variant="outline"
              size="lg"
              className="size-12 shrink-0"
              aria-label={mute}
              pressed={mix[id].muted}
              onPressedChange={() => toggleMute(id)}
            >
              {mix[id].muted ? (
                <VolumeX aria-hidden />
              ) : (
                <Volume2 aria-hidden />
              )}
            </Toggle>
          </div>
        </div>
      ))}
    </Section>
  )
}

function Repeats() {
  const id = useId()
  const { on, count } = usePractice((state) => state.repeats)
  const setRepeats = usePractice((state) => state.setRepeats)
  return (
    <Section title="Repeticiones">
      <div className="flex items-center justify-between gap-4">
        <label htmlFor={id} className="flex-1 py-3 text-base font-semibold">
          Parar tras N vueltas
        </label>
        <Switch
          id={id}
          checked={on}
          onCheckedChange={(checked) => setRepeats({ on: checked })}
        />
      </div>
      {on && (
        <Stepper
          label="Vueltas"
          min={1}
          max={999}
          value={count}
          onChange={(value) => setRepeats({ count: value })}
          decreaseLabel="Menos vueltas"
          increaseLabel="Más vueltas"
        />
      )}
    </Section>
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
    <section className={SECTION}>
      <fieldset className="flex flex-col gap-3">
        <legend className={`${HEADING} mb-3`}>Notas</legend>
        <div className="grid grid-cols-6 gap-2">
          {NOTES.map((note) => (
            <Toggle
              key={note.id}
              variant="outline"
              size="lg"
              className={PICKED_ITEM}
              pressed={notes.includes(note.id)}
              onPressedChange={() => toggleNote(note.id)}
            >
              <span className="note-label [--note-size:1.25rem]">
                {note.label}
              </span>
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
    </section>
  )
}
