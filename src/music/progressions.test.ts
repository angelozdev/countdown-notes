import { describe, expect, test } from 'vitest'
import { chordSymbol } from './chords'
import { METER_BY_ID } from './meters'
import { spell } from './notes'
import {
  barsOf,
  keyLabel,
  PROGRESSION_BY_ID,
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
})
