import { type CSSProperties, Fragment, useId, useRef, useState } from 'react'
import { PlayButton } from '@/App'
import { ChordTypeSelect } from '@/components/chord-type-select'
import { SplitLabel } from '@/components/lane'
import { Section } from '@/components/settings-panel'
import { PICKED_ITEM, TonicPicker } from '@/components/tonic-picker'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'
import { chordSymbol } from '@/music/chords'
import { splitAt } from '@/music/meters'
import { NOTE_BY_ID, NOTES, type NoteId, spell } from '@/music/notes'
import { myProgression } from '@/music/progressions'
import type { WrittenBar, WrittenChord } from '@/music/progression-text'
import { canSave, isDirty, meterOf, usePractice } from '@/practice/store'

/** El editor de una progresión, a pantalla completa mientras hay un borrador. */
export function ProgressionEditor() {
  const errorsId = useId()
  const lane = useRef<HTMLOListElement>(null)
  const addButton = useRef<HTMLButtonElement>(null)
  const [asking, setAsking] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const editor = usePractice((state) => state.editor)
  const savable = usePractice(canSave)
  const dirty = usePractice(isDirty)
  const setDraftText = usePractice((state) => state.setDraftText)
  const setDraftName = usePractice((state) => state.setDraftName)
  const setDraftKey = usePractice((state) => state.setDraftKey)
  const saveDraft = usePractice((state) => state.saveDraft)
  const closeEditor = usePractice((state) => state.closeEditor)
  const discardDraft = usePractice((state) => state.discardDraft)
  const deleteProgression = usePractice((state) => state.deleteProgression)
  const setChord = usePractice((state) => state.setChord)
  const addBar = usePractice((state) => state.addBar)
  const removeBar = usePractice((state) => state.removeBar)
  const splitBar = usePractice((state) => state.splitBar)
  const joinBar = usePractice((state) => state.joinBar)
  const duplicateBar = usePractice((state) => state.duplicateBar)
  const meter = usePractice(meterOf)
  // el compás y la parte del selector; `open` aparte para que no cambie mientras se cierra,
  // y `kept` es el compás como estaba al cerrarlo con una acción, para que no cambie al deslizarse
  const [picking, setPicking] = useState<{
    bar: number
    part: number
    open: boolean
    kept?: WrittenBar
  }>({ bar: 0, part: 0, open: false })
  // lo que se borra es lo guardado, no el nombre que se está escribiendo
  const savedName = usePractice(
    (state) => state.mine.find(({ id }) => id === state.editor?.id)?.name
  )
  if (!editor) return null
  const { name, key, text, errors, bars } = editor
  const picked = picking.kept ?? bars[picking.bar]
  const chord = picked?.[picking.part]
  const joined = picked?.length === 2
  // cierra el selector después de una acción sobre su compás
  const act = (action: (bar: number) => void) => {
    action(picking.bar)
    setPicking({ ...picking, open: false, kept: picked })
  }
  const starts = [0, splitAt(meter)]
  // la hoja no tiene `Trigger`, así que Radix no sabe a dónde devolver el foco: va al botón que
  // la abrió, o al que ocupa su lugar si ese ya no existe (Unir, Quitar)
  const refocus = (event: Event) => {
    event.preventDefault()
    const items = Array.from(lane.current?.children ?? [])
    const buttons =
      items[Math.min(picking.bar, items.length - 1)]?.querySelectorAll('button')
    const button = buttons?.[Math.min(picking.part, buttons.length - 1)]
    ;(button ?? addButton.current)?.focus()
  }

  return (
    <main
      aria-label="Editor de progresiones"
      className="h-dvh overflow-y-auto p-safe"
    >
      <div className="mx-auto flex min-h-full w-full max-w-xl flex-col gap-5">
        <h1 className="sr-only">Editor de progresiones</h1>
        <Button
          variant="ghost"
          size="lg"
          className="-ml-3 h-12 self-start rounded-full px-3 text-base"
          onClick={() => (dirty ? setAsking(true) : closeEditor())}
        >
          Listo
        </Button>
        <input
          aria-label="Nombre"
          autoCapitalize="sentences"
          spellCheck={false}
          className="h-12 w-full rounded-lg border border-input bg-transparent px-3 text-xl font-black outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          value={name}
          onChange={(event) => setDraftName(event.target.value)}
        />
        {/* el campo y el carril van arriba: con el teclado abierto del iPhone se ven juntos */}
        <Section title="Acordes">
          <div className="flex flex-col gap-2">
            <textarea
              aria-label="Acordes"
              aria-invalid={errors.length > 0 || undefined}
              aria-describedby={errors.length > 0 ? errorsId : undefined}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder="Dm7 G7 Cmaj7 Cmaj7"
              rows={3}
              className="w-full rounded-lg border border-input bg-transparent p-3 text-lg font-semibold outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/20"
              value={text}
              onChange={(event) => setDraftText(event.target.value)}
            />
            {errors.length > 0 && (
              <ul
                id={errorsId}
                className="flex flex-col gap-1 rounded-lg bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive"
              >
                {errors.map(({ start, message }) => (
                  <li key={start}>{message}</li>
                ))}
              </ul>
            )}
          </div>
          <ol
            ref={lane}
            aria-label="Compases"
            className="grid grid-cols-4 gap-y-3"
          >
            {bars.map((chords, i) => {
              const notes = chords.map(({ root }) => spell(root))
              const labels = chords.map(({ type }, j) =>
                chordSymbol(notes[j], type)
              )
              const split = chords.length > 1
              // las partes de un compás se leen juntas: comparten el tamaño que le cabe a la más larga
              const rootChars = Math.max(
                ...notes.map(({ label }) => label.length)
              )
              const suffixChars = Math.max(
                ...labels.map(
                  (label, j) => label.length - notes[j].label.length
                )
              )
              return (
                <li
                  key={i}
                  style={
                    {
                      '--root-chars': rootChars,
                      '--suffix-chars': suffixChars
                    } as CSSProperties
                  }
                  className={cn(
                    'flex [container-type:inline-size] border-l-2 border-foreground/30',
                    (i % 4 === 3 || i === bars.length - 1) && 'border-r-2'
                  )}
                >
                  {chords.map((_, j) => (
                    <Fragment key={j}>
                      {j > 0 && (
                        <span
                          aria-hidden
                          className="my-1 w-0.5 self-stretch rounded-full bg-current opacity-50"
                        />
                      )}
                      <button
                        type="button"
                        aria-label={`Compás ${i + 1}${split ? `, parte ${j + 1}` : ''}: ${labels[j]}`}
                        data-at={split ? starts[j] : undefined}
                        // la parte con la hoja abierta, en ámbar: es la que se está editando
                        data-editing={
                          (picking.open &&
                            picking.bar === i &&
                            picking.part === j) ||
                          undefined
                        }
                        // cada parte, de ancho proporcional a sus golpes, como en el carril de práctica
                        style={{
                          flexGrow: (starts[j + 1] ?? meter.beats) - starts[j]
                        }}
                        className="flex min-h-20 basis-0 items-center justify-center rounded-sm outline-none transition-colors [container-type:inline-size] hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset active:bg-muted data-editing:bg-primary data-editing:text-primary-foreground"
                        onClick={() =>
                          setPicking({ bar: i, part: j, open: true })
                        }
                      >
                        {split ? (
                          <SplitLabel root={notes[j].label} label={labels[j]} />
                        ) : (
                          <span
                            className="note-label note-fit font-black [--note-max:1.875rem] sm:[--note-max:2.25rem]"
                            style={
                              { '--chars': labels[j].length } as CSSProperties
                            }
                          >
                            {labels[j]}
                          </span>
                        )}
                      </button>
                    </Fragment>
                  ))}
                </li>
              )
            })}
          </ol>
          <Button
            ref={addButton}
            variant="secondary"
            size="lg"
            className="h-12 text-base"
            onClick={addBar}
          >
            Agregar compás
          </Button>
        </Section>
        <Section title="Tonalidad de origen">
          <TonicPicker
            label="Tonalidad de origen"
            progression={myProgression(editor)}
            value={key.tonic}
            onChange={(tonic) => setDraftKey({ ...key, tonic })}
          />
          <ToggleGroup
            type="single"
            aria-label="Tipo de tonalidad"
            variant="outline"
            size="lg"
            className="grid w-full grid-cols-2"
            value={key.type}
            onValueChange={(type) =>
              type && setDraftKey({ ...key, type: type as typeof key.type })
            }
          >
            <ToggleGroupItem value="major" className={PICKED_ITEM}>
              Mayor
            </ToggleGroupItem>
            <ToggleGroupItem value="minor" className={PICKED_ITEM}>
              Menor
            </ToggleGroupItem>
          </ToggleGroup>
        </Section>
        <div className="mt-auto flex flex-col gap-5 border-t border-border pt-5">
          <div className="flex items-center gap-3">
            <PlayButton />
            <Button
              variant="secondary"
              size="lg"
              className="h-16 rounded-full px-6 text-lg font-bold"
              disabled={!savable}
              onClick={saveDraft}
            >
              Guardar
            </Button>
          </div>
          {!editor.isNew && (
            <Button
              variant="destructive"
              size="lg"
              className="h-12 text-base"
              onClick={() => setDeleting(true)}
            >
              Borrar progresión
            </Button>
          )}
        </div>
        <Sheet
          open={picking.open}
          onOpenChange={(open) => setPicking({ ...picking, open })}
        >
          <SheetContent
            side="bottom"
            aria-describedby={undefined}
            onCloseAutoFocus={refocus}
            className="mx-auto w-full max-w-lg rounded-t-2xl pb-[env(safe-area-inset-bottom)]"
          >
            <SheetHeader>
              <SheetTitle className="text-xl">{`Compás ${picking.bar + 1}${picked && picked.length > 1 ? `, parte ${picking.part + 1}` : ''}`}</SheetTitle>
            </SheetHeader>
            {chord && (
              <ChordFields
                chord={chord}
                onChange={(next) => setChord(picking.bar, picking.part, next)}
              />
            )}
            <SheetFooter>
              <Button
                variant="secondary"
                size="lg"
                className="h-12 text-base"
                onClick={() => act(joined ? joinBar : splitBar)}
              >
                {joined ? 'Unir' : 'Partir'}
              </Button>
              <Button
                variant="secondary"
                size="lg"
                className="h-12 text-base"
                onClick={() => act(duplicateBar)}
              >
                Duplicar
              </Button>
              <Button
                variant="secondary"
                size="lg"
                className="h-12 text-base"
                disabled={bars.length < 2}
                onClick={() => act(removeBar)}
              >
                Quitar
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
        <Sheet open={asking} onOpenChange={setAsking}>
          <SheetContent
            side="bottom"
            aria-describedby={undefined}
            showCloseButton={false}
            className="mx-auto w-full max-w-lg rounded-t-2xl pb-[env(safe-area-inset-bottom)]"
          >
            <SheetHeader>
              <SheetTitle className="text-xl">Cambios sin guardar</SheetTitle>
            </SheetHeader>
            <SheetFooter>
              <Button
                size="lg"
                className="h-12 text-base"
                disabled={!savable}
                onClick={() => {
                  saveDraft()
                  closeEditor()
                  setAsking(false)
                }}
              >
                Guardar
              </Button>
              <Button
                variant="secondary"
                size="lg"
                className="h-12 text-base"
                onClick={() => {
                  discardDraft()
                  setAsking(false)
                }}
              >
                Descartar cambios
              </Button>
              <Button
                variant="ghost"
                size="lg"
                className="h-12 text-base"
                onClick={() => setAsking(false)}
              >
                Seguir editando
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
        <Sheet open={deleting} onOpenChange={setDeleting}>
          <SheetContent
            side="bottom"
            aria-describedby={undefined}
            showCloseButton={false}
            className="mx-auto w-full max-w-lg rounded-t-2xl pb-[env(safe-area-inset-bottom)]"
          >
            <SheetHeader>
              <SheetTitle className="text-xl">{`¿Borrar «${savedName}»?`}</SheetTitle>
            </SheetHeader>
            <SheetFooter>
              {/* Cancelar va primero: Radix le da el foco inicial, no a Borrar */}
              <Button
                variant="secondary"
                size="lg"
                className="h-12 text-base"
                onClick={() => setDeleting(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                size="lg"
                className="h-12 text-base"
                onClick={() => deleteProgression(editor.id)}
              >
                Borrar
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
    </main>
  )
}

/** La raíz y el tipo de un acorde: el cuerpo del selector de un compás o de una de sus partes. */
function ChordFields({
  chord,
  onChange
}: {
  chord: WrittenChord
  onChange: (chord: WrittenChord) => void
}) {
  return (
    <div className="flex flex-col gap-3 px-4">
      <ToggleGroup
        type="single"
        aria-label="Raíz"
        variant="outline"
        size="lg"
        className="grid w-full grid-cols-6"
        value={spell(chord.root).id}
        onValueChange={(id) =>
          id &&
          onChange({
            ...chord,
            root: NOTE_BY_ID[id as NoteId].label
              .replace('♭', 'b')
              .replace('♯', '#')
          })
        }
      >
        {NOTES.map(({ id, name, label }) => (
          <ToggleGroupItem
            key={id}
            value={id}
            aria-label={name}
            className={PICKED_ITEM}
          >
            <span className="note-label [--note-size:1.25rem]">{label}</span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <ChordTypeSelect
        value={chord.type}
        onChange={(type) => onChange({ ...chord, type })}
      />
    </div>
  )
}
