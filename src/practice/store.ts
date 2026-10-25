import { createContext, useContext } from 'react'
import { useStore } from 'zustand'
import { shallow } from 'zustand/shallow'
import { createStore } from 'zustand/vanilla'
import type { Bar, Channel, Engine, Mix, Style } from '@/audio/engine'
import { type ChordTypeId, voicingOf } from '@/music/chords'
import {
  accentAt,
  type BassFigure,
  bassAttacks,
  METER_BY_ID,
  type Meter,
  type MeterId
} from '@/music/meters'
import { NOTE_BY_ID, NOTES, type Note, type NoteId } from '@/music/notes'
import {
  barsOf,
  type MyProgression,
  myProgression,
  PROGRESSION_BY_ID,
  type Progression,
  type ProgressionId,
  type RoundChord
} from '@/music/progressions'
import {
  formatProgression,
  parseProgression,
  type TextError,
  type WrittenBar,
  type WrittenChord
} from '@/music/progression-text'
import { loadMyProgressions, saveMyProgressions } from './my-progressions'
import { drawRound } from './round'
import {
  DEFAULT_SETTINGS,
  loadSettings,
  type Mode,
  type Settings,
  saveSettings
} from './settings'

export type Status = 'stopped' | 'countIn' | 'playing'

type RoundBase = {
  number: number
  /** Los compases de la vuelta, cada uno con sus acordes. */
  bars: RoundChord[][]
  /** Copia del ajuste al armarla; no cambia después. */
  meter: MeterId
  /** Compás global donde empieza: el 0 es la cuenta de entrada. */
  firstBar: number
}

export type Round =
  | (RoundBase & {
      mode: 'random'
      /** Orden sorteado: cada nota del pool una vez. */
      notes: NoteId[]
      /** Copia del ajuste al sortearla; no cambia después. */
      barsPerNote: number
    })
  | (RoundBase & {
      mode: 'progression'
      progression: Progression['id']
      /** Copia del ajuste al armarla; no cambia después. */
      tonic: NoteId
    })

/** El borrador del editor: lo que se guarda, más el texto como se escribe (data-model.md, "Borrador"). */
export type Draft = MyProgression & {
  /** Nunca guardada. */
  isNew: boolean
  text: string
  errors: TextError[]
  /** Lo que regía al abrir el editor: vuelve al descartar. */
  opened: { progression: Progression['id']; tonic: NoteId }
}

export type PracticeState = {
  mode: Mode
  progression: Progression['id']
  tonic: NoteId
  status: Status
  /** Lo que está sonando: el compás 0 es la cuenta de entrada. */
  position: { bar: number; beat: number } | null
  bpm: number
  barsPerNote: number
  notes: NoteId[]
  meter: MeterId
  bassFigure: BassFigure
  bassOctave: 1 | 2 | 3
  withChord: boolean
  chordType: ChordTypeId
  style: Style
  mix: Mix
  /** Parar tras `count` vueltas, si `on`. */
  repeats: { on: boolean; count: number }
  /** Lo armado para el compás que suena; sin acorde, `chordType` es null. */
  sounding: { chordType: ChordTypeId | null; style: Style } | null
  /** La vuelta que suena y, desde su última nota, la siguiente. */
  rounds: Round[]
  /** Las progresiones propias guardadas, en orden de creación. */
  mine: MyProgression[]
  /** El borrador abierto en el editor, si lo hay. */
  editor: Draft | null
  play: () => void
  stop: () => void
  /** Cambiar de modo detiene la práctica. */
  setMode: (mode: Mode) => void
  /** Cambiar de progresión detiene la práctica; una propia pone la tónica de su tonalidad. */
  setProgression: (progression: Progression['id']) => void
  /** Aplica desde la siguiente vuelta que se arme. */
  setTonic: (tonic: NoteId) => void
  setBpm: (bpm: number) => void
  setBarsPerNote: (barsPerNote: number) => void
  setMeter: (meter: MeterId) => void
  setBassFigure: (figure: BassFigure) => void
  setBassOctave: (octave: 1 | 2 | 3) => void
  setWithChord: (withChord: boolean) => void
  setChordType: (type: ChordTypeId) => void
  setStyle: (style: Style) => void
  setVolume: (channel: Channel, volume: number) => void
  toggleMute: (channel: Channel) => void
  setRepeats: (patch: Partial<PracticeState['repeats']>) => void
  toggleNote: (id: NoteId) => void
  setGroup: (natural: boolean, included: boolean) => void
  /** Sin `id`, un borrador nuevo, elegido, y detiene la práctica; con `id`, el de esa guardada, sin tocar nada más. */
  openEditor: (id?: MyProgression['id']) => void
  setDraftText: (text: string) => void
  setDraftName: (name: string) => void
  /** La tónica de ajustes pasa a la tónica de la tonalidad (FR-011). */
  setDraftKey: (key: Draft['key']) => void
  /** Editar tocando: cambia el acorde de una parte y reescribe el texto (borra los errores). */
  setChord: (bar: number, part: number, chord: WrittenChord) => void
  /** Agrega al final una copia del último compás; sin compases, la tríada de la tónica. */
  addBar: () => void
  /** Quita un compás; con uno solo, no hace nada. */
  removeBar: (bar: number) => void
  /** Un compás de un acorde pasa a dos partes iguales; uno de dos, no cambia. */
  splitBar: (bar: number) => void
  /** Un compás de dos acordes queda con el primero; uno de un acorde, no cambia. */
  joinBar: (bar: number) => void
  /** Inserta una copia del compás justo después. */
  duplicateBar: (bar: number) => void
  /** Con `canSave`, copia el borrador a `mine`; el editor sigue abierto. */
  saveDraft: () => void
  /** Cierra el editor; la UI pregunta antes si hay cambios sin guardar. */
  closeEditor: () => void
  /** Cierra el editor sin guardar; vuelven la progresión y la tónica que regían al abrirlo. */
  discardDraft: () => void
  /** La quita de `mine`; si era la elegida vuelve la de siempre, y detiene la práctica. Cierra el editor. */
  deleteProgression: (id: MyProgression['id']) => void
}

export type PracticeStore = ReturnType<typeof createPracticeStore>

export const roundLength = (round: Round) => round.bars.length

/** Compases desde el inicio de la vuelta hasta que empieza su última nota (o su último compás): ahí se arma la siguiente. */
export const previewFrom = (round: Round) =>
  round.mode === 'progression'
    ? round.bars.length - 1
    : (round.notes.length - 1) * round.barsPerNote

/** El acorde que suena en ese golpe: el último que entró. */
export const chordAt = (chords: RoundChord[], beat: number) =>
  chords.findLast((chord) => chord.at <= beat)!

/** La vuelta y el compás (su índice) que están sonando, si ya pasó la cuenta de entrada. */
export function nowPlaying({ status, position, rounds }: PracticeState) {
  if (status !== 'playing' || !position) return undefined
  const round = rounds[0]
  return { round, index: position.bar - round.firstBar }
}

/** El compás que suena (el de la vuelta actual) o, detenida, el de los ajustes. */
export const meterOf = (state: PracticeState): Meter =>
  METER_BY_ID[state.rounds[0]?.meter ?? state.meter]

export const NOT_ENOUGH_NOTES = 'Elige al menos 2 notas para tocar.'

export const STYLE_LABELS: Record<Style, string> = {
  warm: 'Analógico cálido',
  pad: 'Pad ambiental'
}

// las conversiones se guardan por objeto: mientras no cambie, la misma Progression, para los selectores
const converted = new WeakMap<MyProgression, Progression>()

/** La progresión elegida (o la de `id`): el borrador si es suyo, si no una propia guardada o la de la biblioteca. */
export function progressionOf(
  state: Pick<PracticeState, 'progression' | 'editor' | 'mine'>,
  id = state.progression
): Progression {
  const mine =
    state.editor?.id === id ? state.editor : state.mine.find((p) => p.id === id)
  if (!mine) return PROGRESSION_BY_ID[id as ProgressionId]
  if (!converted.has(mine)) converted.set(mine, myProgression(mine))
  return converted.get(mine)!
}

/** En el modo aleatorio, con menos de 2 notas no se puede evitar repetir una nota seguida. */
export const canPlay = (state: PracticeState) =>
  state.mode === 'progression'
    ? progressionOf(state).bars !== ''
    : state.notes.length >= 2

/** El borrador tiene algo que perder: una nueva con compases, o una guardada que difiere de lo guardado. */
export function isDirty({ editor, mine }: PracticeState) {
  if (!editor) return false
  if (editor.isNew) return editor.bars.length > 0
  const saved = mine.find((p) => p.id === editor.id)
  return (
    !saved ||
    editor.name.trim() !== saved.name ||
    editor.key.tonic !== saved.key.tonic ||
    editor.key.type !== saved.key.type ||
    JSON.stringify(editor.bars) !== JSON.stringify(saved.bars)
  )
}

export const canSave = (state: PracticeState) =>
  isDirty(state) &&
  state.editor!.errors.length === 0 &&
  state.editor!.bars.length > 0

/** El borrador con otros compases: editar tocando reescribe el texto y reemplaza uno con error. */
const withBars = (editor: Draft, bars: WrittenBar[]): Draft => ({
  ...editor,
  bars,
  text: formatProgression(bars),
  errors: []
})

/** `Progresión N`, con el primer N libre entre los nombres de las guardadas. */
function defaultName(mine: MyProgression[]) {
  const taken = new Set(mine.map(({ name }) => name))
  let n = 1
  while (taken.has(`Progresión ${n}`)) n++
  return `Progresión ${n}`
}

/** Las notas incluidas, sin duplicados y en orden cromático. */
const notesWhere = (included: (note: Note) => boolean) =>
  NOTES.filter(included).map((note) => note.id)

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Math.round(value)))

const SETTING_KEYS = Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[]

const settingsOf = (state: PracticeState) =>
  Object.fromEntries(SETTING_KEYS.map((key) => [key, state[key]])) as Settings

/** Lo que se guarda: mientras haya una nueva sin guardar, lo que regía al abrir el editor. */
const persistedOf = (state: PracticeState): Settings => ({
  ...settingsOf(state),
  ...(state.editor?.isNew && state.editor.opened)
})

/** Cada nota sorteada da `barsPerNote` compases con su raíz sola. */
const randomRound = (
  number: number,
  notes: NoteId[],
  barsPerNote: number,
  meter: MeterId,
  firstBar: number
): Round => ({
  mode: 'random',
  number,
  meter,
  firstBar,
  bars: notes.flatMap((id) =>
    Array.from({ length: barsPerNote }, () => [{ root: NOTE_BY_ID[id], at: 0 }])
  ),
  notes,
  barsPerNote
})

const progressionRound = (
  number: number,
  progression: Progression,
  tonic: NoteId,
  meter: MeterId,
  firstBar: number
): Round => ({
  mode: 'progression',
  number,
  meter,
  firstBar,
  progression: progression.id,
  tonic,
  bars: barsOf(progression, tonic, METER_BY_ID[meter])
})

export function createPracticeStore(engine: Engine) {
  const store = createStore<PracticeState>()((set, get) => {
    // el último compás que el motor pidió con barAt: pide con anticipación, antes de su onBeat
    let requested = 0
    // lo armado en barAt para cada compás, hasta que suena su primer golpe (research §7)
    const planned = new Map<
      number,
      { chordType: ChordTypeId | null; style: Style }
    >()

    // el último voicing armado en la vuelta: el siguiente acorde se liga a él (research §7)
    let lastVoicing: string[] | undefined

    function nextRound(previous: Round): Round {
      const { notes, barsPerNote, meter, tonic } = get()
      const firstBar = previous.firstBar + roundLength(previous)
      if (previous.mode === 'progression') {
        return progressionRound(
          previous.number + 1,
          progressionOf(get()),
          tonic,
          meter,
          firstBar
        )
      }
      // con menos de 2 notas no se puede sortear: sigue con las de la vuelta anterior
      const pool = notes.length >= 2 ? notes : previous.notes
      return randomRound(
        previous.number + 1,
        drawRound(pool, previous.notes.at(-1)),
        barsPerNote,
        meter,
        firstBar
      )
    }

    const clicksOf = (meter: Meter) =>
      Array.from({ length: meter.beats }, (_, at): Bar['events'][number] => ({
        at,
        sound: { kind: 'click', accent: accentAt(meter, at) }
      }))

    const planOf = ({ beats, beatLength }: Meter) => ({ beats, beatLength })

    function barAt(bar: number): Bar | undefined {
      const { rounds, repeats } = get()
      const last = rounds.at(-1)
      // sin vueltas no hay nada que tocar
      if (!last) return undefined
      requested = bar
      if (bar === 0) {
        const meter = METER_BY_ID[rounds[0].meter]
        return { ...planOf(meter), countIn: true, events: clicksOf(meter) }
      }

      // la siguiente vuelta se sortea al empezar la última nota, para mostrarla por adelantado.
      // Es >=, no ===: si N sube o se apaga durante la última nota, el compás pedido ya es el primero de ella
      if (
        bar >= last.firstBar + previewFrom(last) &&
        (!repeats.on || last.number < repeats.count)
      ) {
        set({ rounds: [...rounds, nextRound(last)] })
      }
      const round = get().rounds.find(
        (r) => bar >= r.firstBar && bar < r.firstBar + roundLength(r)
      )
      // ninguna vuelta contiene el compás: la práctica termina aquí
      if (!round) return undefined
      const meter = METER_BY_ID[round.meter]
      const chords = round.bars[bar - round.firstBar]
      // figura, octava y acorde se leen aquí, al armar el compás: un cambio aplica desde el siguiente
      const { bassFigure, bassOctave, withChord, chordType, style } = get()
      // todas las vueltas de una progresión suenan igual: la primera no se liga a la anterior
      if (bar === round.firstBar) lastVoicing = undefined
      const bass = bassAttacks(
        meter,
        bassFigure,
        chords.map((chord) => chord.at)
      ).map(({ at, length }): Bar['events'][number] => ({
        at,
        sound: {
          kind: 'bass',
          pitch: `${chordAt(chords, at).root.id}${bassOctave}`,
          length
        }
      }))
      const chord: Bar['events'] = withChord
        ? chords.map((chord, i): Bar['events'][number] => {
            const pitches = voicingOf(
              chord.root.id,
              chord.type ?? chordType,
              round.mode === 'progression' ? lastVoicing : undefined
            )
            lastVoicing = pitches
            return {
              at: chord.at,
              sound: {
                kind: 'chord',
                pitches,
                length: (chords[i + 1]?.at ?? meter.beats) - chord.at
              }
            }
          })
        : []
      planned.set(bar, { chordType: withChord ? chordType : null, style })
      // el sort es estable: en el mismo at, el click queda antes que el bajo y el bajo antes que el acorde
      return {
        ...planOf(meter),
        style,
        events: [...clicksOf(meter), ...bass, ...chord].sort(
          (a, b) => a.at - b.at
        )
      }
    }

    function onBeat(bar: number, beat: number) {
      const { rounds } = get()
      const current = rounds.filter((r) => r.firstBar + roundLength(r) > bar)
      const sounding = beat === 0 ? planned.get(bar) : undefined
      if (sounding) planned.delete(bar)
      set({
        ...(sounding && { sounding }),
        position: { bar, beat },
        status: bar === 0 ? 'countIn' : 'playing',
        rounds: current.length === rounds.length ? rounds : current
      })
    }

    function changeMix(mix: Mix) {
      set({ mix })
      if (get().status !== 'stopped') engine.setMix(mix)
    }

    const settings = loadSettings()
    const mine = loadMyProgressions()
    return {
      ...settings,
      // una propia que ya no está guardada deja la de siempre
      progression:
        settings.progression in PROGRESSION_BY_ID ||
        mine.some(({ id }) => id === settings.progression)
          ? settings.progression
          : DEFAULT_SETTINGS.progression,
      status: 'stopped',
      position: null,
      sounding: null,
      rounds: [],
      mine,
      editor: null,
      play() {
        const { status, mode, notes, barsPerNote, meter, tonic, bpm, mix } =
          get()
        if (status !== 'stopped' || !canPlay(get())) return
        planned.clear()
        set({
          status: 'countIn',
          position: null,
          sounding: null,
          rounds: [
            mode === 'progression'
              ? progressionRound(1, progressionOf(get()), tonic, meter, 1)
              : randomRound(1, drawRound(notes), barsPerNote, meter, 1)
          ]
        })
        engine
          .start({ bpm, mix, barAt, onBeat, onEnd: get().stop })
          .catch(() => get().stop())
      },
      stop() {
        engine.stop()
        planned.clear()
        set({ status: 'stopped', position: null, sounding: null, rounds: [] })
      },
      setMode(mode) {
        if (get().status !== 'stopped') get().stop()
        set({ mode })
      },
      setProgression(progression) {
        if (get().status !== 'stopped') get().stop()
        const mine = get().mine.find(({ id }) => id === progression)
        set({ progression, ...(mine && { tonic: mine.key.tonic }) })
      },
      setTonic(tonic) {
        set({ tonic })
      },
      setBpm(bpm) {
        const next = clamp(bpm, 30, 240)
        set({ bpm: next })
        if (get().status !== 'stopped') engine.setBpm(next)
      },
      setBarsPerNote(barsPerNote) {
        set({ barsPerNote: clamp(barsPerNote, 1, 16) })
      },
      setMeter(meter) {
        set({ meter })
      },
      setBassFigure(bassFigure) {
        set({ bassFigure })
      },
      setBassOctave(bassOctave) {
        set({ bassOctave })
      },
      setWithChord(withChord) {
        set({ withChord })
      },
      setChordType(chordType) {
        set({ chordType })
      },
      setStyle(style) {
        set({ style })
      },
      setVolume(channel, volume) {
        const { mix } = get()
        changeMix({
          ...mix,
          [channel]: { ...mix[channel], volume: clamp(volume, 0, 100) }
        })
      },
      toggleMute(channel) {
        const { mix } = get()
        changeMix({
          ...mix,
          [channel]: { ...mix[channel], muted: !mix[channel].muted }
        })
      },
      setRepeats(patch) {
        const { repeats, rounds } = get()
        const next = { ...repeats, ...patch }
        next.count = clamp(next.count, 1, 999)
        // la vuelta en curso ya es la última: se descarta la vista previa de la siguiente,
        // salvo que el motor ya haya pedido su primer compás: esa se toca y el fin llega después
        const dropNext =
          next.on &&
          rounds.length > 1 &&
          rounds[0].number >= next.count &&
          rounds[1].firstBar > requested
        set({ repeats: next, rounds: dropNext ? rounds.slice(0, 1) : rounds })
      },
      toggleNote(id) {
        const { notes } = get()
        const wasIncluded = notes.includes(id)
        set({
          notes: notesWhere((note) =>
            note.id === id ? !wasIncluded : notes.includes(note.id)
          )
        })
      },
      setGroup(natural, included) {
        const { notes } = get()
        set({
          notes: notesWhere((note) =>
            note.natural === natural ? included : notes.includes(note.id)
          )
        })
      },
      openEditor(saved) {
        const { mine, progression, tonic } = get()
        if (saved) {
          const found = mine.find(({ id }) => id === saved)
          if (!found) return
          set({
            editor: {
              ...found,
              text: formatProgression(found.bars),
              errors: [],
              isNew: false,
              opened: { progression, tonic }
            }
          })
          return
        }
        if (get().status !== 'stopped') get().stop()
        const id: MyProgression['id'] = `propia-${Math.max(0, ...mine.map(({ id }) => Number(id.slice(7)))) + 1}`
        set({
          progression: id,
          editor: {
            id,
            name: defaultName(mine),
            key: { tonic, type: 'major' },
            text: '',
            bars: [],
            errors: [],
            isNew: true,
            opened: { progression, tonic }
          }
        })
      },
      setDraftText(text) {
        const { editor } = get()
        if (!editor) return
        const result = parseProgression(text)
        set({
          editor: {
            ...editor,
            text,
            ...('bars' in result
              ? { bars: result.bars, errors: [] }
              : { errors: result.errors })
          }
        })
      },
      setDraftName(name) {
        const { editor } = get()
        if (editor) set({ editor: { ...editor, name } })
      },
      setDraftKey(key) {
        const { editor } = get()
        if (editor) set({ editor: { ...editor, key }, tonic: key.tonic })
      },
      setChord(bar, part, chord) {
        const { editor } = get()
        if (!editor) return
        set({
          editor: withBars(
            editor,
            editor.bars.map((chords, i) =>
              i === bar
                ? chords.map((c, j) => (j === part ? chord : c))
                : chords
            )
          )
        })
      },
      addBar() {
        const { editor } = get()
        if (!editor) return
        const { bars, key } = editor
        const triad: WrittenBar = [
          {
            root: myProgression(editor).key.tonic,
            type: key.type === 'minor' ? 'm' : 'maj'
          }
        ]
        set({ editor: withBars(editor, [...bars, bars.at(-1) ?? triad]) })
      },
      removeBar(bar) {
        const { editor } = get()
        if (!editor || editor.bars.length < 2) return
        set({
          editor: withBars(
            editor,
            editor.bars.filter((_, i) => i !== bar)
          )
        })
      },
      splitBar(bar) {
        const { editor } = get()
        if (!editor) return
        set({
          editor: withBars(
            editor,
            editor.bars.map((chords, i) =>
              i === bar && chords.length === 1 ? [chords[0], chords[0]] : chords
            )
          )
        })
      },
      joinBar(bar) {
        const { editor } = get()
        if (!editor) return
        set({
          editor: withBars(
            editor,
            editor.bars.map((chords, i) =>
              i === bar ? chords.slice(0, 1) : chords
            )
          )
        })
      },
      duplicateBar(bar) {
        const { editor } = get()
        if (!editor) return
        set({
          editor: withBars(
            editor,
            editor.bars.flatMap((chords, i) =>
              i === bar ? [chords, chords] : [chords]
            )
          )
        })
      },
      saveDraft() {
        const { editor, mine, progression, tonic } = get()
        if (!editor || !canSave(get())) return
        const { id, key, bars } = editor
        const saved = mine.find((p) => p.id === id)
        const name = editor.name.trim() || saved?.name || defaultName(mine)
        const next: MyProgression = { id, name, key, bars }
        const updated = saved
          ? mine.map((p) => (p.id === id ? next : p))
          : [...mine, next]
        saveMyProgressions(updated)
        set({
          mine: updated,
          editor: {
            ...editor,
            name,
            isNew: false,
            opened: { progression, tonic }
          }
        })
      },
      closeEditor() {
        // una nueva sin guardar desaparece: se descarta, para que vuelva lo que regía
        if (get().editor?.isNew) get().discardDraft()
        else set({ editor: null })
      },
      discardDraft() {
        const { editor, progression } = get()
        if (!editor) return
        const { opened } = editor
        // la práctica se detiene solo si cambia la elegida
        if (opened.progression !== progression) {
          get().setProgression(opened.progression)
        }
        set({ tonic: opened.tonic, editor: null })
      },
      deleteProgression(id) {
        if (get().status !== 'stopped') get().stop()
        const { mine, progression } = get()
        const rest = mine.filter((p) => p.id !== id)
        saveMyProgressions(rest)
        set({
          mine: rest,
          ...(progression === id && {
            progression: DEFAULT_SETTINGS.progression
          }),
          editor: null
        })
      }
    }
  })
  // se guarda solo cuando cambia un ajuste, no en cada golpe
  store.subscribe((state, prev) => {
    const settings = persistedOf(state)
    if (!shallow(settings, persistedOf(prev))) saveSettings(settings)
  })
  return store
}

export const PracticeContext = createContext<PracticeStore | null>(null)

export function usePractice<T>(selector: (state: PracticeState) => T): T {
  const store = useContext(PracticeContext)
  if (!store) throw new Error('usePractice necesita un PracticeContext')
  return useStore(store, selector)
}
