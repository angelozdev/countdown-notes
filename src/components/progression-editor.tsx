import { type CSSProperties, useId, useState } from 'react'
import { PlayButton } from '@/App'
import { ChordTypeSelect } from '@/components/chord-type-select'
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
import { NOTE_BY_ID, NOTES, type NoteId, spell } from '@/music/notes'
import { myProgression } from '@/music/progressions'
import { canSave, isDirty, usePractice } from '@/practice/store'

/** El editor de una progresión, a pantalla completa mientras hay un borrador. */
export function ProgressionEditor() {
  const errorsId = useId()
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
  // el compás del selector; `open` aparte para que no cambie de compás mientras se cierra
  const [picking, setPicking] = useState({ bar: 0, open: false })
  // lo que se borra es lo guardado, no el nombre que se está escribiendo
  const savedName = usePractice(
    (state) => state.mine.find(({ id }) => id === state.editor?.id)?.name
  )
  if (!editor) return null
  const { name, key, text, errors, bars } = editor
  const chord = bars[picking.bar]?.[0]

  return (
    <main
      aria-label="Editor de progresiones"
      className="flex h-dvh flex-col gap-4 overflow-y-auto p-safe"
    >
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="lg"
          className="h-12 rounded-full px-5 text-base"
          onClick={() => (dirty ? setAsking(true) : closeEditor())}
        >
          Listo
        </Button>
        {!editor.isNew && (
          <Button
            variant="destructive"
            size="lg"
            className="h-12 rounded-full px-5 text-base"
            onClick={() => setDeleting(true)}
          >
            Borrar progresión
          </Button>
        )}
      </div>
      <input
        aria-label="Nombre"
        autoCapitalize="sentences"
        spellCheck={false}
        className="h-12 w-full rounded-lg border border-input bg-transparent px-3 text-lg font-bold outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        value={name}
        onChange={(event) => setDraftName(event.target.value)}
      />
      <p className="text-sm text-muted-foreground">Tonalidad de origen</p>
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
      <textarea
        aria-label="Acordes"
        aria-invalid={errors.length > 0 || undefined}
        aria-describedby={errors.length > 0 ? errorsId : undefined}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        placeholder="Dm7 G7 Cmaj7 Cmaj7"
        rows={3}
        className="w-full rounded-lg border border-input bg-transparent p-3 text-lg font-semibold outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20"
        value={text}
        onChange={(event) => setDraftText(event.target.value)}
      />
      {errors.length > 0 && (
        <ul id={errorsId} className="text-sm font-medium text-destructive">
          {errors.map(({ start, message }) => (
            <li key={start}>{message}</li>
          ))}
        </ul>
      )}
      <ol aria-label="Compases" className="grid grid-cols-4 gap-y-3">
        {bars.map(([{ root, type }], i) => {
          const label = chordSymbol(spell(root), type)
          return (
            <li
              key={i}
              className={cn(
                'flex [container-type:inline-size] border-l-2 border-foreground/30',
                (i % 4 === 3 || i === bars.length - 1) && 'border-r-2'
              )}
            >
              <button
                type="button"
                aria-label={`Compás ${i + 1}: ${label}`}
                className="flex min-h-20 w-full items-center justify-center"
                onClick={() => setPicking({ bar: i, open: true })}
              >
                <span
                  className="note-label note-fit font-black [--note-max:1.875rem] sm:[--note-max:2.25rem]"
                  style={{ '--chars': label.length } as CSSProperties}
                >
                  {label}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
      <Button
        variant="secondary"
        size="lg"
        className="h-12 text-base"
        onClick={addBar}
      >
        Agregar compás
      </Button>
      <div className="mt-auto flex items-center gap-3">
        <PlayButton />
        <Button
          size="lg"
          className="h-12 px-6 text-base"
          disabled={!savable}
          onClick={saveDraft}
        >
          Guardar
        </Button>
      </div>
      <Sheet
        open={picking.open}
        onOpenChange={(open) => setPicking({ ...picking, open })}
      >
        <SheetContent
          side="bottom"
          aria-describedby={undefined}
          className="mx-auto w-full max-w-lg rounded-t-2xl pb-[env(safe-area-inset-bottom)]"
        >
          <SheetHeader>
            <SheetTitle className="text-xl">{`Compás ${picking.bar + 1}`}</SheetTitle>
          </SheetHeader>
          {chord && (
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
                  setChord(picking.bar, 0, {
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
                    <span className="note-label [--note-size:1.25rem]">
                      {label}
                    </span>
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              <ChordTypeSelect
                value={chord.type}
                onChange={(type) =>
                  setChord(picking.bar, 0, { ...chord, type })
                }
              />
            </div>
          )}
          <SheetFooter>
            <Button
              variant="secondary"
              size="lg"
              className="h-12 text-base"
              disabled={bars.length < 2}
              onClick={() => {
                removeBar(picking.bar)
                setPicking({ ...picking, open: false })
              }}
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
    </main>
  )
}
