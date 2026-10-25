import { describe, expect, test } from 'vitest'
import { chordSymbol } from './chords'
import { METER_BY_ID } from './meters'
import { NOTES, type NoteId, spell } from './notes'
import {
  barsOf,
  keyLabel,
  type Progression,
  PROGRESSION_BY_ID,
  type ProgressionId,
  PROGRESSIONS,
  type RoundChord,
  tonicOf
} from './progressions'

const text = (bars: RoundChord[][]) =>
  bars
    .map((bar) =>
      bar
        .map((chord) =>
          chord.type ? chordSymbol(chord.root, chord.type) : chord.root.label
        )
        .join(' ')
    )
    .join(' | ')

describe('spell', () => {
  test('escribe una nota con su altura, su cifrado y su nombre', () => {
    expect(spell('C#')).toEqual({
      id: 'Db',
      label: 'C♯',
      name: 'Do sostenido',
      natural: false
    })
    expect(spell('Gb')).toEqual({
      id: 'Gb',
      label: 'G♭',
      name: 'Sol bemol',
      natural: false
    })
    expect(spell('F')).toEqual({
      id: 'F',
      label: 'F',
      name: 'Fa',
      natural: true
    })
  })
})

describe('ii–V–I mayor', () => {
  test('en Do suena Dm7 | G7 | Cmaj7 | Cmaj7, todo en el golpe 0', () => {
    const bars = barsOf(
      PROGRESSION_BY_ID['ii-v-i-mayor'],
      'C',
      METER_BY_ID['4/4']
    )
    expect(text(bars)).toBe('Dm7 | G7 | Cmaj7 | Cmaj7')
    expect(bars.flat().map((chord) => chord.at)).toEqual([0, 0, 0, 0])
  })

  test('la raíz del primer acorde es Re', () => {
    const [[first]] = barsOf(
      PROGRESSION_BY_ID['ii-v-i-mayor'],
      'C',
      METER_BY_ID['4/4']
    )
    expect(first.root.label).toBe('D')
    expect(first.root.name).toBe('Re')
  })

  test('la tonalidad es Do mayor y la tónica es C', () => {
    const progression = PROGRESSION_BY_ID['ii-v-i-mayor']
    expect(keyLabel(progression, 'C')).toBe('Do mayor')
    expect(tonicOf(progression, 'C').label).toBe('C')
  })

  test('está en la biblioteca, en Jazz', () => {
    expect(PROGRESSIONS).toContainEqual(
      expect.objectContaining({
        id: 'ii-v-i-mayor',
        name: 'ii–V–I mayor',
        group: 'Jazz'
      })
    )
  })

  test.each([
    ['F', 'Gm7 | C7 | Fmaj7 | Fmaj7'],
    ['B', 'C♯m7 | F♯7 | Bmaj7 | Bmaj7'],
    ['Gb', 'G♯m7 | C♯7 | F♯maj7 | F♯maj7'],
    ['Eb', 'Fm7 | B♭7 | E♭maj7 | E♭maj7']
  ] as const)('en %s suena %s', (tonic, expected) => {
    const bars = barsOf(
      PROGRESSION_BY_ID['ii-v-i-mayor'],
      tonic,
      METER_BY_ID['4/4']
    )
    expect(text(bars)).toBe(expected)
  })

  test('la tónica se escribe con la tabla mayor en las 12', () => {
    const progression = PROGRESSION_BY_ID['ii-v-i-mayor']
    expect(NOTES.map((note) => tonicOf(progression, note.id).label)).toEqual(
      'C D♭ D E♭ E F F♯ G A♭ A B♭ B'.split(' ')
    )
  })

  test('la tonalidad en Fa es Fa mayor y en Re bemol, Re bemol mayor', () => {
    const progression = PROGRESSION_BY_ID['ii-v-i-mayor']
    expect(keyLabel(progression, 'F')).toBe('Fa mayor')
    expect(keyLabel(progression, 'Db')).toBe('Re bemol mayor')
  })
})

const FOUR_FOUR = METER_BY_ID['4/4']

/** FR-018 sin ×N: cada compás escrito a mano, en su tonalidad de origen. */
const LIBRARY: [ProgressionId, NoteId, string][] = [
  ['ii-v-i-mayor', 'C', 'Dm7 | G7 | Cmaj7 | Cmaj7'],
  ['ii-v-i-menor', 'C', 'Dm7♭5 | G7♭9 | Cm6 | Cm6'],
  ['turnaround', 'C', 'Cmaj7 A7 | Dm7 G7'],
  ['iii-vi-ii-v', 'C', 'Em7 A7 | Dm7 G7'],
  [
    'ciclo-diatonico',
    'C',
    'Cmaj7 | Fmaj7 | Bm7♭5 | Em7 | Am7 | Dm7 | G7 | Cmaj7'
  ],
  ['sustituto-tritonal', 'C', 'Dm7 | D♭7 | Cmaj7 | Cmaj7'],
  ['backdoor', 'C', 'Fm7 | B♭7 | Cmaj7 | Cmaj7'],
  [
    'blues-jazz',
    'C',
    'C7 | F7 | C7 | C7 | F7 | F7 | C7 | A7 | Dm7 | G7 | C7 A7 | Dm7 G7'
  ],
  [
    'blues-menor',
    'C',
    'Cm7 | Cm7 | Cm7 | Cm7 | Fm7 | Fm7 | Cm7 | Cm7 | A♭7 | G7 | Cm7 | G7'
  ],
  ['modal', 'D', 'Dm7 | Dm7 | Dm7 | Dm7 | Dm7 | Dm7 | Dm7 | Dm7'],
  ['giant-steps', 'C', 'Cmaj7 E♭7 | A♭maj7 B7 | Emaj7 G7 | Cmaj7'],
  ['i-v-vi-iv', 'C', 'C | G | Am | F'],
  ['vi-iv-i-v', 'C', 'Am | F | C | G'],
  ['doo-wop', 'C', 'C | Am | F | G'],
  ['i-iv-v', 'C', 'C | F | G | G'],
  [
    'blues-rock',
    'C',
    'C7 | C7 | C7 | C7 | F7 | F7 | C7 | C7 | G7 | F7 | C7 | G7'
  ],
  ['andaluza', 'A', 'Am | G | F | E']
]

describe('la biblioteca de jazz, pop, rock y latino', () => {
  test('la biblioteca trae las 17 progresiones de FR-018', () => {
    expect(
      PROGRESSIONS.filter(({ group }) => group !== 'Ciclos').map(
        ({ name }) => name
      )
    ).toEqual([
      'ii–V–I mayor',
      'ii–V–i menor',
      'I–vi–ii–V (turnaround)',
      'iii–vi–ii–V',
      'Ciclo diatónico (tipo Autumn Leaves)',
      'Sustituto tritonal',
      'ii–V "backdoor"',
      'Blues de jazz',
      'Blues menor',
      'Modal (tipo So What)',
      'Coltrane (Giant Steps, avanzado)',
      'I–V–vi–IV',
      'vi–IV–I–V',
      'I–vi–IV–V (doo-wop)',
      'I–IV–V',
      'Blues de rock',
      'Cadencia andaluza'
    ])
  })

  test.each(LIBRARY)('%s en %s suena %s', (id, origin, expected) => {
    expect(text(barsOf(PROGRESSION_BY_ID[id], origin, FOUR_FOUR))).toBe(
      expected
    )
  })

  test.each(LIBRARY)(
    'en las 12 tónicas, %s conserva el lugar de cada acorde y una grafía simple',
    (id, origin) => {
      const progression = PROGRESSION_BY_ID[id]
      const index = (note: { id: NoteId }) =>
        NOTES.findIndex(({ id }) => id === note.id)
      const shape = (tonic: NoteId) => {
        const tonicIndex = index(tonicOf(progression, tonic))
        return barsOf(progression, tonic, FOUR_FOUR).map((bar) =>
          bar.map(({ root, type, at }) => ({
            type,
            at,
            distance: (index(root) - tonicIndex + 12) % 12
          }))
        )
      }
      const expected = shape(origin)

      for (const { id: tonic } of NOTES) {
        expect(shape(tonic)).toEqual(expected)
        for (const { root } of barsOf(progression, tonic, FOUR_FOUR).flat()) {
          expect(root.label).not.toMatch(/^(E♯|B♯|C♭|F♭)|[♭♯]{2}/)
        }
      }
    }
  )

  test.each([
    ['andaluza', 'A', 'Am | G | F | E'],
    ['andaluza', 'C', 'Cm | B♭ | A♭ | G'],
    ['andaluza', 'Db', 'C♯m | B | A | G♯'],
    ['andaluza', 'Eb', 'E♭m | D♭ | B | B♭'],
    [
      'ciclo-diatonico',
      'Gb',
      'F♯maj7 | Bmaj7 | Fm7♭5 | A♯m7 | D♯m7 | G♯m7 | C♯7 | F♯maj7'
    ],
    ['giant-steps', 'Gb', 'F♯maj7 A7 | Dmaj7 F7 | A♯maj7 C♯7 | F♯maj7'],
    ['modal', 'F', Array(8).fill('Fm7').join(' | ')],
    ['modal', 'Db', Array(8).fill('C♯m7').join(' | ')]
  ] as const)('a mano: %s en %s suena %s', (id, tonic, expected) => {
    expect(text(barsOf(PROGRESSION_BY_ID[id], tonic, FOUR_FOUR))).toBe(expected)
  })

  test('la tónica menor y dórica se escribe con la tabla menor', () => {
    expect(
      NOTES.map((note) => tonicOf(PROGRESSION_BY_ID.andaluza, note.id).label)
    ).toEqual('C C♯ D E♭ E F F♯ G G♯ A B♭ B'.split(' '))
  })

  test('tonicOf y keyLabel dicen la tonalidad de cada tipo', () => {
    const { andaluza, modal } = PROGRESSION_BY_ID
    expect(tonicOf(andaluza, 'Db').label).toBe('C♯')
    expect(tonicOf(andaluza, 'Ab').label).toBe('G♯')
    expect(keyLabel(andaluza, 'Db')).toBe('Do sostenido menor')
    expect(keyLabel(modal, 'D')).toBe('Re dórico')
  })

  test.each([
    ['4/4', 2],
    ['3/4', 2],
    ['7/8', 4]
  ] as const)(
    'en %s el segundo acorde del compás entra en el golpe %i',
    (id, at) => {
      const bars = barsOf(PROGRESSION_BY_ID.turnaround, 'C', METER_BY_ID[id])
      expect(bars.map((bar) => bar.map((chord) => chord.at))).toEqual([
        [0, at],
        [0, at]
      ])
    }
  )

  test('un sufijo desconocido es un error', () => {
    const unknown: Progression = {
      ...PROGRESSION_BY_ID['ii-v-i-mayor'],
      bars: 'Cxyz'
    }
    expect(() => barsOf(unknown, 'C', FOUR_FOUR)).toThrow('Acorde desconocido')
  })

  test('más de dos acordes en un compás es un error', () => {
    const crowded: Progression = {
      ...PROGRESSION_BY_ID['ii-v-i-mayor'],
      bars: 'C F G'
    }
    expect(() => barsOf(crowded, 'C', FOUR_FOUR)).toThrow('Más de dos acordes')
  })
})
