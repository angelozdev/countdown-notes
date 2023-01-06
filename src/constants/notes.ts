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

export const naturalNotes: TNotes[] = ['C', 'D', 'E/Fb', 'F', 'G', 'A', 'B/Cb']
export const sharpNotes: TNotes[] = [
  'C#/Db',
  'D#/Eb',
  'F#/Gb',
  'G#/Ab',
  'A#/Bb'
]

export const notesSet = new Set(noteList)
