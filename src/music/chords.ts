import { NOTE_BY_ID, NOTES, type NoteId } from './notes'

// crece con la tabla de FR-005 (US2)
export type ChordTypeId = 'maj' | 'm' | 'dim' | 'aug' | 'sus4' | 'sus2'

export type ChordFamily =
  | 'Tríadas'
  | 'Sextas'
  | 'Séptimas'
  | 'Extensiones'
  | 'Dominantes alterados'

export type ChordType = {
  id: ChordTypeId
  family: ChordFamily
  /** El cifrado es la raíz más este sufijo ('m7♭5'). */
  suffix: string
  /** 'semidisminuido': sigue al nombre de la raíz. */
  name: string
  /** Semitonos desde la raíz (research §5). */
  forms: number[][]
}

const triad = (
  id: ChordTypeId,
  suffix: string,
  name: string,
  form: number[]
): ChordType => ({ id, family: 'Tríadas', suffix, name, forms: [form] })

/** Los tipos, en el orden de FR-005. */
export const CHORD_TYPES: ChordType[] = [
  triad('maj', '', 'mayor', [0, 7, 16]),
  triad('m', 'm', 'menor', [0, 7, 15]),
  triad('dim', 'dim', 'disminuido', [0, 6, 15]),
  triad('aug', 'aug', 'aumentado', [0, 8, 16]),
  triad('sus4', 'sus4', 'con cuarta suspendida', [0, 7, 17]),
  triad('sus2', 'sus2', 'con segunda suspendida', [0, 7, 14])
]

export const CHORD_TYPE_BY_ID = Object.fromEntries(
  CHORD_TYPES.map((type) => [type.id, type])
) as Record<ChordTypeId, ChordType>

/** 'F♯m' */
export const chordSymbol = (root: NoteId, type: ChordTypeId) =>
  NOTE_BY_ID[root].label + CHORD_TYPE_BY_ID[type].suffix

/** 'Fa sostenido menor' */
export const chordName = (root: NoteId, type: ChordTypeId) =>
  `${NOTE_BY_ID[root].name} ${CHORD_TYPE_BY_ID[type].name}`

const pitchOf = (midi: number) =>
  `${NOTES[midi % 12].id}${Math.floor(midi / 12) - 1}`

/** Alturas de Tone, de grave a agudo: ['C3', 'G3', 'E4'] */
export function voicingOf(root: NoteId, type: ChordTypeId): string[] {
  // una sola forma por ahora: la raíz en la octava 3
  const base = 48 + NOTES.findIndex((note) => note.id === root)
  return CHORD_TYPE_BY_ID[type].forms[0].map((semitones) =>
    pitchOf(base + semitones)
  )
}
