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

// FR-008: clases (semitonos desde la raíz) que el voicing debe tener; un
// arreglo es "una de". `absent` son las que no puede tener.
const JAZZ: [ChordTypeId, string, string, (number | number[])[], number[]][] = [
  ['6', '6', 'sexta', [4, 9], []],
  ['m6', 'm6', 'menor sexta', [3, 9], []],
  ['69', '6/9', 'sexta novena', [4, 9, 2], []],
  ['maj7', 'maj7', 'séptima mayor', [4, 11], []],
  ['m7', 'm7', 'menor séptima', [3, 10], []],
  ['7', '7', 'séptima', [4, 10], []],
  ['m7b5', 'm7♭5', 'semidisminuido', [3, 6, 10], []],
  ['dim7', '°7', 'disminuido séptima', [3, 6, 9], []],
  ['mMaj7', 'm(maj7)', 'menor séptima mayor', [3, 11], []],
  ['7sus4', '7sus4', 'séptima con cuarta suspendida', [5, 10], [4]],
  ['maj9', 'maj9', 'novena mayor', [4, 11, 2], []],
  ['m9', 'm9', 'menor novena', [3, 10, 2], []],
  ['9', '9', 'novena', [4, 10, 2], []],
  ['m11', 'm11', 'menor oncena', [3, 10, 5], []],
  ['13', '13', 'trecena', [4, 10, 9], []],
  ['7b9', '7♭9', 'séptima novena bemol', [4, 10, 1], []],
  ['7#9', '7♯9', 'séptima novena sostenida', [4, 10, 3], []],
  ['7#11', '7♯11', 'séptima oncena sostenida', [4, 10, 6], []],
  ['7alt', '7alt', 'séptima alterada', [4, 10, [1, 3], [6, 8]], []]
]

describe.each(JAZZ)('%s', (id, suffix, name, required, absent) => {
  test.each(NOTES.map((note, index) => ({ note, index })))(
    'sobre $note.label: cifrado, nombre y voicing sin raíz',
    ({ note, index }) => {
      expect(chordSymbol(note.id, id)).toBe(note.label + suffix)
      expect(chordName(note.id, id)).toBe(`${note.name} ${name}`)
      const pitches = voicingOf(note.id, id).map(midi)
      const classes = pitches.map((pitch) => (pitch - index) % 12)
      expect(pitches.length).toBeGreaterThanOrEqual(3)
      expect(pitches.length).toBeLessThanOrEqual(5)
      expect(pitches).toEqual([...pitches].sort((a, b) => a - b))
      expect(classes).not.toContain(0)
      for (const wanted of required) {
        expect(
          [wanted].flat().some((semitones) => classes.includes(semitones))
        ).toBe(true)
      }
      for (const semitones of absent) expect(classes).not.toContain(semitones)
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

test('B♭m7♭5 se cifra B♭m7♭5 y se nombra Si bemol semidisminuido', () => {
  expect(chordSymbol('Bb', 'm7b5')).toBe('B♭m7♭5')
  expect(chordName('Bb', 'm7b5')).toBe('Si bemol semidisminuido')
})

test('F♯m7 se toca en A3, D♭4, E4', () => {
  expect(voicingOf('Gb', 'm7')).toEqual(['A3', 'Db4', 'E4'])
})

test('el ii–V–I mueve poco las voces', () => {
  expect(voicingOf('D', 'm7')).toEqual(['F3', 'A3', 'C4'])
  expect(voicingOf('G', '7', ['F3', 'A3', 'C4'])).toEqual(['F3', 'B3', 'D4'])
  expect(voicingOf('G', '7')).toEqual(['B3', 'D4', 'F4'])
  expect(voicingOf('C', 'maj7', ['F3', 'B3', 'D4'])).toEqual(['E3', 'G3', 'B3'])
})

test('un acorde repetido conserva su voicing', () => {
  expect(voicingOf('C', 'maj7', ['E3', 'G3', 'B3'])).toEqual(['E3', 'G3', 'B3'])
})

test('las tríadas no cambian con after', () => {
  expect(voicingOf('C', 'maj', ['F3', 'B3', 'D4'])).toEqual(['C3', 'G3', 'E4'])
})

// La suma, sobre cada nota del voicing, de su distancia en semitonos a la nota más cercana del anterior.
const movement = (voicing: string[], after: string[]) =>
  voicing
    .map(midi)
    .reduce(
      (sum, pitch) =>
        sum + Math.min(...after.map((other) => Math.abs(pitch - midi(other)))),
      0
    )

describe('la cadena ii–V–I en las 12 tónicas', () => {
  test.each(NOTES.map((note, index) => ({ note, index })))(
    'sobre $note.label: cada voicing cumple las reglas y se mueve lo menos posible',
    ({ index }) => {
      const chain: [ChordTypeId, number][] = [
        ['m7', (index + 2) % 12],
        ['7', (index + 7) % 12],
        ['maj7', index]
      ]
      let before: string[] | undefined
      for (const [type, rootIndex] of chain) {
        const { id: root } = NOTES[rootIndex]
        const voicing = voicingOf(root, type, before)
        const pitches = voicing.map(midi)
        const classes = pitches.map((pitch) => (pitch - rootIndex) % 12)
        const required = JAZZ.find(([id]) => id === type)![3]
        expect(classes).not.toContain(0)
        for (const wanted of required) {
          expect(
            [wanted].flat().some((semitones) => classes.includes(semitones))
          ).toBe(true)
        }
        expect(pitches.every((pitch) => pitch >= 48 && pitch <= 76)).toBe(true)
        // el ii no tiene anterior: se compara consigo mismo (0 ≤ 0)
        const reference = before ?? voicing
        expect(movement(voicing, reference)).toBeLessThanOrEqual(
          movement(voicingOf(root, type), reference)
        )
        before = voicing
      }
    }
  )
})
