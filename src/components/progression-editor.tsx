import { type CSSProperties, useId, useState } from 'react'
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
import { spell } from '@/music/notes'
import { myProgression } from '@/music/progressions'
import { canSave, isDirty, usePractice } from '@/practice/store'

/** El editor de una progresión, a pantalla completa mientras hay un borrador. */
export function ProgressionEditor() {
  const errorsId = useId()
  const [asking, setAsking] = useState(false)
  const editor = usePractice((state) => state.editor)
  const savable = usePractice(canSave)
  const dirty = usePractice(isDirty)
  const setDraftText = usePractice((state) => state.setDraftText)
  const setDraftName = usePractice((state) => state.setDraftName)
  const setDraftKey = usePractice((state) => state.setDraftKey)
  const saveDraft = usePractice((state) => state.saveDraft)
  const closeEditor = usePractice((state) => state.closeEditor)
  const discardDraft = usePractice((state) => state.discardDraft)
  if (!editor) return null
  const { name, key, text, errors, bars } = editor

  return (
    <main
      aria-label="Editor de progresiones"
      className="flex h-dvh flex-col gap-4 overflow-y-auto p-safe"
    >
      <div>
        <Button
          variant="ghost"
          size="lg"
          className="h-12 rounded-full px-5 text-base"
          onClick={() => (dirty ? setAsking(true) : closeEditor())}
        >
          Listo
        </Button>
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
      <div className="mt-auto flex justify-end">
        <Button
          size="lg"
          className="h-12 px-6 text-base"
          disabled={!savable}
          onClick={saveDraft}
        >
          Guardar
        </Button>
      </div>
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
    </main>
  )
}
