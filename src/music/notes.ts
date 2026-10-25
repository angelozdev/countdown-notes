// El id también es la altura para Tone ('Bb' → 'Bb2'). F♯ usa 'Gb', que es la misma altura.
export type NoteId =
  | 'C'
  | 'Db'
  | 'D'
  | 'Eb'
  | 'E'
  | 'F'
  | 'Gb'
  | 'G'
  | 'Ab'
  | 'A'
  | 'Bb'
  | 'B'

export type Note = {
  id: NoteId
  label: string
  name: string
  natural: boolean
}

/** Las 12 notas en orden cromático, con la grafía de jazz para las negras. */
export const NOTES: Note[] = [
  { id: 'C', label: 'C', name: 'Do', natural: true },
  { id: 'Db', label: 'D♭', name: 'Re bemol', natural: false },
  { id: 'D', label: 'D', name: 'Re', natural: true },
  { id: 'Eb', label: 'E♭', name: 'Mi bemol', natural: false },
  { id: 'E', label: 'E', name: 'Mi', natural: true },
  { id: 'F', label: 'F', name: 'Fa', natural: true },
  { id: 'Gb', label: 'F♯', name: 'Fa sostenido', natural: false },
  { id: 'G', label: 'G', name: 'Sol', natural: true },
  { id: 'Ab', label: 'A♭', name: 'La bemol', natural: false },
  { id: 'A', label: 'A', name: 'La', natural: true },
  { id: 'Bb', label: 'B♭', name: 'Si bemol', natural: false },
  { id: 'B', label: 'B', name: 'Si', natural: true }
]

export const NOTE_BY_ID = Object.fromEntries(
  NOTES.map((note) => [note.id, note])
) as Record<NoteId, Note>

const LETTERS: Record<string, { pitch: number; name: string }> = {
  C: { pitch: 0, name: 'Do' },
  D: { pitch: 2, name: 'Re' },
  E: { pitch: 4, name: 'Mi' },
  F: { pitch: 5, name: 'Fa' },
  G: { pitch: 7, name: 'Sol' },
  A: { pitch: 9, name: 'La' },
  B: { pitch: 11, name: 'Si' }
}

/** 'C#' → { id: 'Db', label: 'C♯', name: 'Do sostenido', natural: false } */
export function spell(name: string): Note {
  const [letter, accidental] = name
  const { pitch, name: spoken } = LETTERS[letter]
  const shift = accidental === '#' ? 1 : accidental === 'b' ? -1 : 0
  return {
    id: NOTES[(pitch + shift + 12) % 12].id,
    label: letter + (shift === 1 ? '♯' : shift === -1 ? '♭' : ''),
    name: spoken + (shift === 1 ? ' sostenido' : shift === -1 ? ' bemol' : ''),
    natural: shift === 0
  }
}
