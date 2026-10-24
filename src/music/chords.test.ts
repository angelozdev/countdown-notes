import { describe, expect, test } from 'vitest'
import { chordName, chordSymbol, type ChordTypeId, voicingOf } from './chords'
import { NOTES } from './notes'

const midi = (pitch: string) => {
  const [, id, octave] = /^([A-G]b?)(\d)$/.exec(pitch)!
  return NOTES.findIndex((note) => note.id === id) + 12 * (Number(octave) + 1)
}

const TRIADS: [ChordTypeId, string, string, number[]][] = [
  ['maj', '', 'mayor', [0, 7, 16]],
  ['m', 'm', 'menor', [0, 7, 15]],
  ['dim', 'dim', 'disminuido', [0, 6, 15]],
  ['aug', 'aug', 'aumentado', [0, 8, 16]],
  ['sus4', 'sus4', 'con cuarta suspendida', [0, 7, 17]],
  ['sus2', 'sus2', 'con segunda suspendida', [0, 7, 14]]
]

describe.each(TRIADS)('tríada %s', (id, suffix, name, shape) => {
  test.each(NOTES.map((note, index) => ({ note, index })))(
    'sobre $note.label: cifrado, nombre y voicing',
    ({ note, index }) => {
      expect(chordSymbol(note.id, id)).toBe(note.label + suffix)
      expect(chordName(note.id, id)).toBe(`${note.name} ${name}`)
      const pitches = voicingOf(note.id, id).map(midi)
      expect(pitches).toEqual(shape.map((semitones) => 48 + index + semitones))
      expect(pitches.every((pitch) => pitch >= 48 && pitch <= 76)).toBe(true)
    }
  )
})

test('F♯ menor se cifra F♯m y se nombra Fa sostenido menor', () => {
  expect(chordSymbol('Gb', 'm')).toBe('F♯m')
  expect(chordName('Gb', 'm')).toBe('Fa sostenido menor')
})

test('Do mayor se toca en voicing abierto: C3, G3, E4', () => {
  expect(voicingOf('C', 'maj')).toEqual(['C3', 'G3', 'E4'])
})
