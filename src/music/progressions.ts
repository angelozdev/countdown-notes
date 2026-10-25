import { distance } from '@tonaljs/interval'
import { simplify, transpose } from '@tonaljs/note'
import { CHORD_TYPES, type ChordTypeId } from './chords'
import type { Meter } from './meters'
import { type Note, type NoteId, spell } from './notes'

export type KeyType = 'major'
export type ProgressionGroup = 'Ciclos' | 'Jazz' | 'Pop, rock y latino'
export type ProgressionId = 'ii-v-i-mayor'
export type RoundChord = { root: Note; type?: ChordTypeId; at: number }

export type Progression = {
  id: ProgressionId
  name: string
  group: ProgressionGroup
  key: { tonic: string; type: KeyType }
  bars: string
  cycle?: 'fourths' | 'fifths'
  rootsOnly?: true
}

/** En el orden de FR-016, FR-018 y FR-019. */
export const PROGRESSIONS: Progression[] = [
  {
    id: 'ii-v-i-mayor',
    name: 'ii–V–I mayor',
    group: 'Jazz',
    key: { tonic: 'C', type: 'major' },
    bars: 'Dm7 | G7 | Cmaj7 | Cmaj7'
  }
]

export const PROGRESSION_BY_ID = Object.fromEntries(
  PROGRESSIONS.map((progression) => [progression.id, progression])
) as Record<ProgressionId, Progression>

/** La tónica de cada clase escrita según el tipo de tonalidad (research §5), en el formato de tonal. */
const TONICS: Record<KeyType, Record<NoteId, string>> = {
  major: {
    C: 'C',
    Db: 'Db',
    D: 'D',
    Eb: 'Eb',
    E: 'E',
    F: 'F',
    Gb: 'F#',
    G: 'G',
    Ab: 'Ab',
    A: 'A',
    Bb: 'Bb',
    B: 'B'
  }
}

/** 'Dm7' → raíz 'D', tipo m7; 'B♭maj7' → raíz 'Bb' (el formato de tonal). */
function readChord(chord: string): { root: string; type: ChordTypeId } {
  const [, letter, accidental, suffix] = /^([A-G])([♭♯]?)(.*)$/.exec(chord)!
  const type = CHORD_TYPES.find((candidate) => candidate.suffix === suffix)
  if (!type) throw new Error(`Acorde desconocido: ${chord}`)
  return {
    root: letter + accidental.replace('♭', 'b').replace('♯', '#'),
    type: type.id
  }
}

/** La tónica escrita con la tabla de la progresión. */
export const tonicOf = (progression: Progression, tonic: NoteId): Note =>
  spell(TONICS[progression.key.type][tonic])

/** 'Fa mayor' */
export const keyLabel = (progression: Progression, tonic: NoteId) =>
  `${tonicOf(progression, tonic).name} mayor`

/** Los compases transportados a la tónica: US3 los parte según el compás. */
export const barsOf = (
  progression: Progression,
  tonic: NoteId,
  _meter: Meter
): RoundChord[][] => {
  const interval = distance(
    progression.key.tonic,
    TONICS[progression.key.type][tonic]
  )
  return progression.bars.split('|').map((bar) =>
    bar
      .trim()
      .split(/\s+/)
      .map((chord) => {
        const { root, type } = readChord(chord)
        // simplify evita E♯, B♯, C♭, F♭ y las dobles alteraciones (FR-013).
        return { root: spell(simplify(transpose(root, interval))), type, at: 0 }
      })
  )
}
