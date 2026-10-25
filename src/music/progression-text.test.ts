import { describe, expect, test } from 'vitest'
import { CHORD_TYPES, chordSymbol, type ChordTypeId } from './chords'
import { NOTES } from './notes'
import {
  formatProgression,
  parseProgression,
  type WrittenBar
} from './progression-text'

const tonal = (label: string) => label.replace(/♭/g, 'b').replace(/♯/g, '#')

const bar = (root: string, type: ChordTypeId) => ({ bars: [[{ root, type }]] })

const CHORDS = CHORD_TYPES.flatMap((type) =>
  NOTES.map((note) => ({ type, note }))
)

describe('los 25 tipos sobre las 12 raíces', () => {
  test.each(CHORDS)('$note.label$type.suffix', ({ type, note }) => {
    const expected = bar(tonal(note.label), type.id)
    expect(parseProgression(note.label + type.suffix)).toEqual(expected)
    expect(parseProgression(tonal(note.label + type.suffix))).toEqual(expected)
    expect(formatProgression(expected.bars)).toBe(chordSymbol(note.id, type.id))
  })
})

describe('minúsculas y alias', () => {
  test.each<[string, string, ChordTypeId]>([
    ['bbm7b5', 'Bb', 'm7b5'],
    ['f#7#9', 'F#', '7#9'],
    ['dm7', 'D', 'm7'],
    ['b', 'B', 'maj'],
    ['Cø', 'C', 'm7b5'],
    ['Cø7', 'C', 'm7b5'],
    ['Co7', 'C', 'dim7'],
    ['Cdim7', 'C', 'dim7']
  ])('%s', (text, root, type) => {
    expect(parseProgression(text)).toEqual(bar(root, type))
  })
})

describe('enarmónica simple', () => {
  test.each<[string, string, ChordTypeId]>([
    ['E#7', 'F', '7'],
    ['Cb', 'B', 'maj'],
    ['Fb', 'E', 'maj'],
    ['B#', 'C', 'maj']
  ])('%s', (text, root, type) => {
    expect(parseProgression(text)).toEqual(bar(root, type))
  })
})

describe('separadores', () => {
  test('espacios: un compás por acorde', () => {
    expect(parseProgression('Dm7 G7 Cmaj7 Cmaj7')).toEqual({
      bars: [
        [{ root: 'D', type: 'm7' }],
        [{ root: 'G', type: '7' }],
        [{ root: 'C', type: 'maj7' }],
        [{ root: 'C', type: 'maj7' }]
      ]
    })
  })

  test('saltos de línea y espacios repetidos también separan', () => {
    expect(parseProgression('Dm7\n  G7   Cmaj7')).toEqual({
      bars: [
        [{ root: 'D', type: 'm7' }],
        [{ root: 'G', type: '7' }],
        [{ root: 'C', type: 'maj7' }]
      ]
    })
  })
})

describe('compases de dos acordes', () => {
  test('con barras, cada trozo es un compás de uno o dos acordes', () => {
    expect(parseProgression('Cmaj7 | C7 A7 | Dm7 G7')).toEqual({
      bars: [
        [{ root: 'C', type: 'maj7' }],
        [
          { root: 'C', type: '7' },
          { root: 'A', type: '7' }
        ],
        [
          { root: 'D', type: 'm7' },
          { root: 'G', type: '7' }
        ]
      ]
    })
  })

  test('una barra al borde es opcional', () => {
    expect(parseProgression('| Dm7 | G7 |')).toEqual({
      bars: [[{ root: 'D', type: 'm7' }], [{ root: 'G', type: '7' }]]
    })
  })
})

describe('errores', () => {
  test('un acorde que no se reconoce, citado y con su posición', () => {
    expect(parseProgression('Dm7 Hm7 G7')).toEqual({
      errors: [{ start: 4, end: 7, message: 'No reconozco «Hm7».' }]
    })
  })

  test.each(['Cbb', 'Dm7x'])('%s no se reconoce', (word) => {
    expect(parseProgression(word)).toEqual({
      errors: [
        { start: 0, end: word.length, message: `No reconozco «${word}».` }
      ]
    })
  })

  test.each(['', '   '])('el texto vacío %j pide un acorde', (text) => {
    expect(parseProgression(text)).toEqual({
      errors: [
        { start: 0, end: text.length, message: 'Escribe al menos un acorde.' }
      ]
    })
  })

  test('tres acordes en un compás, citados con su posición', () => {
    expect(parseProgression('C | Dm7 G7 C')).toEqual({
      errors: [
        {
          start: 4,
          end: 12,
          message: 'Un compás tiene uno o dos acordes: «Dm7 G7 C».'
        }
      ]
    })
  })

  test('un compás vacío entre dos barras', () => {
    expect(parseProgression('Dm7 || G7')).toEqual({
      errors: [
        { start: 4, end: 6, message: 'Hay un compás vacío entre dos barras.' }
      ]
    })
  })

  test('un acorde que no se reconoce dentro de un compás', () => {
    expect(parseProgression('Dm7 | Hm7 G7')).toEqual({
      errors: [{ start: 6, end: 9, message: 'No reconozco «Hm7».' }]
    })
  })

  test('varios errores, en orden', () => {
    expect(parseProgression('Hm7 Xb')).toEqual({
      errors: [
        { start: 0, end: 3, message: 'No reconozco «Hm7».' },
        { start: 4, end: 6, message: 'No reconozco «Xb».' }
      ]
    })
  })
})

describe('formatProgression', () => {
  test('compases separados por barras', () => {
    expect(
      formatProgression([
        [{ root: 'D', type: 'm7' }],
        [{ root: 'G', type: '7' }],
        [{ root: 'C', type: 'maj7' }]
      ])
    ).toBe('Dm7 | G7 | Cmaj7')
  })

  test('los acordes de un compás, con espacio', () => {
    expect(
      formatProgression([
        [{ root: 'C', type: 'maj7' }],
        [
          { root: 'C', type: '7' },
          { root: 'A', type: '7' }
        ],
        [
          { root: 'D', type: 'm7' },
          { root: 'G', type: '7' }
        ]
      ])
    ).toBe('Cmaj7 | C7 A7 | Dm7 G7')
  })

  test.each([
    'Dm7 G7 Cmaj7 Cmaj7',
    'Cmaj7 | C7 A7 | Dm7 G7',
    '| Dm7 | G7 |',
    'Bbm7b5 E7b9 | Am | F#7 B'
  ])('%s: escrito y leído da los mismos compases', (text) => {
    const { bars } = parseProgression(text) as { bars: WrittenBar[] }
    expect(parseProgression(formatProgression(bars))).toEqual({ bars })
  })
})
