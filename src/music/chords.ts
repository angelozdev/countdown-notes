import { type Note, NOTE_BY_ID, NOTES, type NoteId } from './notes'

export type ChordTypeId =
  | 'maj'
  | 'm'
  | 'dim'
  | 'aug'
  | 'sus4'
  | 'sus2'
  | '6'
  | 'm6'
  | '69'
  | 'maj7'
  | 'm7'
  | '7'
  | 'm7b5'
  | 'dim7'
  | 'mMaj7'
  | '7sus4'
  | 'maj9'
  | 'm9'
  | '9'
  | 'm11'
  | '13'
  | '7b9'
  | '7#9'
  | '7#11'
  | '7alt'

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

/** Sin raíz (la toca el bajo): la forma A (desde la tercera) y la B (desde la séptima o la sexta). */
const jazz = (
  id: ChordTypeId,
  family: ChordFamily,
  suffix: string,
  name: string,
  a: number[],
  b: number[]
): ChordType => ({ id, family, suffix, name, forms: [a, b] })

/** Los tipos, en el orden de FR-005. */
export const CHORD_TYPES: ChordType[] = [
  triad('maj', '', 'mayor', [0, 7, 16]),
  triad('m', 'm', 'menor', [0, 7, 15]),
  triad('dim', 'dim', 'disminuido', [0, 6, 15]),
  triad('aug', 'aug', 'aumentado', [0, 8, 16]),
  triad('sus4', 'sus4', 'con cuarta suspendida', [0, 7, 17]),
  triad('sus2', 'sus2', 'con segunda suspendida', [0, 7, 14]),
  jazz('6', 'Sextas', '6', 'sexta', [4, 7, 9], [9, 16, 19]),
  jazz('m6', 'Sextas', 'm6', 'menor sexta', [3, 7, 9], [9, 15, 19]),
  jazz('69', 'Sextas', '6/9', 'sexta novena', [4, 9, 14], [9, 14, 16]),
  jazz('maj7', 'Séptimas', 'maj7', 'séptima mayor', [4, 7, 11], [11, 16, 19]),
  jazz('m7', 'Séptimas', 'm7', 'menor séptima', [3, 7, 10], [10, 15, 19]),
  jazz('7', 'Séptimas', '7', 'séptima', [4, 7, 10], [10, 16, 19]),
  jazz('m7b5', 'Séptimas', 'm7♭5', 'semidisminuido', [3, 6, 10], [10, 15, 18]),
  jazz('dim7', 'Séptimas', '°7', 'disminuido séptima', [3, 6, 9], [9, 15, 18]),
  jazz(
    'mMaj7',
    'Séptimas',
    'm(maj7)',
    'menor séptima mayor',
    [3, 7, 11],
    [11, 15, 19]
  ),
  jazz(
    '7sus4',
    'Séptimas',
    '7sus4',
    'séptima con cuarta suspendida',
    [5, 7, 10],
    [10, 17, 19]
  ),
  jazz(
    'maj9',
    'Extensiones',
    'maj9',
    'novena mayor',
    [4, 7, 11, 14],
    [11, 14, 16, 19]
  ),
  jazz(
    'm9',
    'Extensiones',
    'm9',
    'menor novena',
    [3, 7, 10, 14],
    [10, 14, 15, 19]
  ),
  jazz('9', 'Extensiones', '9', 'novena', [4, 7, 10, 14], [10, 14, 16, 19]),
  jazz(
    'm11',
    'Extensiones',
    'm11',
    'menor oncena',
    [3, 10, 14, 17],
    [5, 10, 15, 19]
  ),
  jazz('13', 'Extensiones', '13', 'trecena', [4, 9, 10, 14], [10, 14, 16, 21]),
  jazz(
    '7b9',
    'Dominantes alterados',
    '7♭9',
    'séptima novena bemol',
    [4, 7, 10, 13],
    [10, 13, 16, 19]
  ),
  jazz(
    '7#9',
    'Dominantes alterados',
    '7♯9',
    'séptima novena sostenida',
    [4, 7, 10, 15],
    [10, 15, 16, 19]
  ),
  jazz(
    '7#11',
    'Dominantes alterados',
    '7♯11',
    'séptima oncena sostenida',
    [4, 10, 14, 18],
    [10, 14, 16, 18]
  ),
  jazz(
    '7alt',
    'Dominantes alterados',
    '7alt',
    'séptima alterada',
    [4, 8, 10, 15],
    [10, 15, 16, 20]
  )
]

export const CHORD_TYPE_BY_ID = Object.fromEntries(
  CHORD_TYPES.map((type) => [type.id, type])
) as Record<ChordTypeId, ChordType>

const noteOf = (root: NoteId | Note) =>
  typeof root === 'string' ? NOTE_BY_ID[root] : root

/** 'F♯m'; con un Note, su label: chordSymbol(spell('C#'), 'm7') → 'C♯m7' */
export const chordSymbol = (root: NoteId | Note, type: ChordTypeId) =>
  noteOf(root).label + CHORD_TYPE_BY_ID[type].suffix

/** 'Fa sostenido menor' */
export const chordName = (root: NoteId | Note, type: ChordTypeId) =>
  `${noteOf(root).name} ${CHORD_TYPE_BY_ID[type].name}`

const pitchOf = (midi: number) =>
  `${NOTES[midi % 12].id}${Math.floor(midi / 12) - 1}`

/** Alturas de Tone, de grave a agudo: ['C3', 'G3', 'E4'] */
export function voicingOf(root: NoteId, type: ChordTypeId): string[] {
  const { forms } = CHORD_TYPE_BY_ID[type]
  const index = NOTES.findIndex((note) => note.id === root)
  // las tríadas: una sola forma, con la raíz en la octava 3
  if (forms.length === 1) {
    return forms[0].map((semitones) => pitchOf(48 + index + semitones))
  }
  // research §5: las formas que caen enteras en C3–E5 (MIDI 48–76), desplazadas por octavas
  const fits = forms
    .flatMap((form) =>
      Array.from({ length: 7 }, (_, octave) =>
        form.map((semitones) => index + 12 * octave + semitones)
      )
    )
    .filter((midis) => midis[0] >= 48 && midis[midis.length - 1] <= 76)
  // gana la más cercana a C4; en un empate, la primera (la A). Las formas tienen las mismas notas
  const distance = (midis: number[]) =>
    Math.abs(midis.reduce((sum, midi) => sum + midi) - 60 * midis.length)
  return fits
    .reduce((best, midis) => (distance(midis) < distance(best) ? midis : best))
    .map(pitchOf)
}
