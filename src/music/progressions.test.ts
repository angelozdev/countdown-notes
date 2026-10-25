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

const CYCLE_FOURTHS =
  'C | C | F | F | B♭ | B♭ | E♭ | E♭ | A♭ | A♭ | D♭ | D♭ | G♭ | G♭ | B | B | E | E | A | A | D | D | G | G'
const CYCLE_FIFTHS =
  'C | C | G | G | D | D | A | A | E | E | B | B | F♯ | F♯ | D♭ | D♭ | A♭ | A♭ | E♭ | E♭ | B♭ | B♭ | F | F'
const II_V_I_12 = [
  'Dm7 | G7 | Cmaj7 | Cmaj7',
  'Gm7 | C7 | Fmaj7 | Fmaj7',
  'Cm7 | F7 | B♭maj7 | B♭maj7',
  'Fm7 | B♭7 | E♭maj7 | E♭maj7',
  'B♭m7 | E♭7 | A♭maj7 | A♭maj7',
  'E♭m7 | A♭7 | D♭maj7 | D♭maj7',
  'A♭m7 | D♭7 | G♭maj7 | G♭maj7',
  'C♯m7 | F♯7 | Bmaj7 | Bmaj7',
  'F♯m7 | B7 | Emaj7 | Emaj7',
  'Bm7 | E7 | Amaj7 | Amaj7',
  'Em7 | A7 | Dmaj7 | Dmaj7',
  'Am7 | D7 | Gmaj7 | Gmaj7'
].join(' | ')

/** FR-018 sin ×N y los ciclos de FR-019: cada compás escrito a mano, en su tonalidad de origen. */
const LIBRARY: [ProgressionId, NoteId, string][] = [
  ['ciclo-cuartas', 'C', CYCLE_FOURTHS],
  ['ciclo-quintas', 'C', CYCLE_FIFTHS],
  ['ii-v-i-12', 'C', II_V_I_12],
  ['dominantes-encadenados', 'C', 'E7 | A7 | D7 | G7 | Cmaj7 | Cmaj7'],
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

describe('los ciclos por las 12 tonalidades', () => {
  const CYCLES = [
    'ciclo-cuartas',
    'ciclo-quintas',
    'ii-v-i-12',
    'dominantes-encadenados'
  ] as const

  test('el grupo Ciclos va primero, con sus 4 progresiones', () => {
    expect(PROGRESSIONS.slice(0, 4).map(({ name }) => name)).toEqual([
      'Ciclo de cuartas',
      'Ciclo de quintas',
      'ii–V–I por las 12 tonalidades',
      'Dominantes encadenados'
    ])
    expect(PROGRESSIONS.slice(0, 4).map(({ group }) => group)).toEqual(
      Array(4).fill('Ciclos')
    )
    expect(PROGRESSIONS.slice(0, 4).map(({ id }) => id)).toEqual(CYCLES)
    expect(PROGRESSIONS.filter(({ group }) => group === 'Ciclos')).toHaveLength(
      4
    )
  })

  test.each([
    ['ciclo-cuartas', 'C', CYCLE_FOURTHS],
    ['ciclo-quintas', 'C', CYCLE_FIFTHS],
    ['dominantes-encadenados', 'C', 'E7 | A7 | D7 | G7 | Cmaj7 | Cmaj7'],
    ['dominantes-encadenados', 'F', 'A7 | D7 | G7 | C7 | Fmaj7 | Fmaj7']
  ] as const)('%s en %s suena %s', (id, tonic, expected) => {
    expect(text(barsOf(PROGRESSION_BY_ID[id], tonic, FOUR_FOUR))).toBe(expected)
  })

  test('el ii–V–I por las 12 en Do tiene 48 compases, uno por cada acorde de cada tonalidad', () => {
    const bars = barsOf(PROGRESSION_BY_ID['ii-v-i-12'], 'C', FOUR_FOUR)
    const shown = text(bars).split(' | ')
    expect(bars).toHaveLength(48)
    expect(shown.slice(0, 4)).toEqual(['Dm7', 'G7', 'Cmaj7', 'Cmaj7'])
    expect(shown[4]).toBe('Gm7')
    expect(shown.slice(24, 28)).toEqual(['A♭m7', 'D♭7', 'G♭maj7', 'G♭maj7'])
    expect(shown.slice(28, 31)).toEqual(['C♯m7', 'F♯7', 'Bmaj7'])
    expect(
      shown
        .filter((_, i) => i % 4 === 2)
        .map((chord) => chord.replace('maj7', ''))
    ).toEqual('C F B♭ E♭ A♭ D♭ G♭ B E A D G'.split(' '))
  })

  test('desde otra tónica, el ciclo de cuartas sigue por cuartas y el de quintas, por quintas', () => {
    const fourths = text(
      barsOf(PROGRESSION_BY_ID['ciclo-cuartas'], 'F', FOUR_FOUR)
    ).split(' | ')
    expect(fourths).toHaveLength(24)
    expect(fourths.slice(0, 3)).toEqual(['F', 'F', 'B♭'])
    expect(fourths.slice(-2)).toEqual(['C', 'C'])
  })

  test('en Sol bemol, el ciclo de cuartas empieza en G♭ y el de quintas en F♯', () => {
    const first = (id: ProgressionId) =>
      barsOf(PROGRESSION_BY_ID[id], 'Gb', FOUR_FOUR)[0][0].root.label
    expect(first('ciclo-cuartas')).toBe('G♭')
    expect(first('ciclo-quintas')).toBe('F♯')
  })

  test.each(['ciclo-cuartas', 'ciclo-quintas'] as const)(
    '%s no fija el tipo de ningún acorde',
    (id) => {
      const chords = barsOf(PROGRESSION_BY_ID[id], 'C', FOUR_FOUR).flat()
      expect(chords).toHaveLength(24)
      expect(chords.filter((chord) => chord.type !== undefined)).toEqual([])
    }
  )

  test('cada compás empieza en el golpe 0, y las 12 vueltas no comparten acordes', () => {
    for (const id of CYCLES) {
      const bars = barsOf(PROGRESSION_BY_ID[id], 'C', FOUR_FOUR)
      for (const bar of bars) expect(bar[0].at).toBe(0)
    }
    const bars = barsOf(PROGRESSION_BY_ID['ii-v-i-12'], 'C', FOUR_FOUR)
    expect(new Set(bars.map((bar) => bar[0])).size).toBe(bars.length)
  })

  test('keyLabel dice desde qué tónica empieza el ciclo', () => {
    expect(keyLabel(PROGRESSION_BY_ID['ciclo-cuartas'], 'F')).toBe('desde Fa')
    expect(keyLabel(PROGRESSION_BY_ID['ii-v-i-12'], 'C')).toBe('desde Do')
    expect(keyLabel(PROGRESSION_BY_ID['dominantes-encadenados'], 'F')).toBe(
      'Fa mayor'
    )
  })

  test('la tónica del ciclo de cuartas usa G♭, y la del de quintas, F♯', () => {
    expect(tonicOf(PROGRESSION_BY_ID['ciclo-cuartas'], 'Gb').label).toBe('G♭')
    expect(tonicOf(PROGRESSION_BY_ID['ii-v-i-12'], 'Gb').label).toBe('G♭')
    expect(tonicOf(PROGRESSION_BY_ID['ciclo-quintas'], 'Gb').label).toBe('F♯')
  })
})
