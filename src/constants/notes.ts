export type TNotes =
  | 'C'
  | 'C#/Db'
  | 'D'
  | 'D#/Eb'
  | 'E/Fb'
  | 'F'
  | 'F#/Gb'
  | 'G'
  | 'G#/Ab'
  | 'A'
  | 'A#/Bb'
  | 'B/Cb'

export const noteList: TNotes[] = [
  'C',
  'C#/Db',
  'D',
  'D#/Eb',
  'E/Fb',
  'F',
  'F#/Gb',
  'G',
  'G#/Ab',
  'A',
  'A#/Bb',
  'B/Cb'
]

export const notesSet = new Set(noteList)
