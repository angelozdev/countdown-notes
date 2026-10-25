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

/** 'Dm7' → raíz D, tipo m7; 'B♭maj7' → raíz 'Bb'. */
function readChord(chord: string): Omit<RoundChord, 'at'> {
  const [, letter, accidental, suffix] = /^([A-G])([♭♯]?)(.*)$/.exec(chord)!
  const type = CHORD_TYPES.find((candidate) => candidate.suffix === suffix)
  if (!type) throw new Error(`Acorde desconocido: ${chord}`)
  const root = spell(letter + accidental.replace('♭', 'b').replace('♯', '#'))
  return { root, type: type.id }
}

/** La tónica escrita con la tabla de la progresión. */
export const tonicOf = (progression: Progression, _tonic: NoteId): Note =>
  spell(progression.key.tonic)

/** 'Fa mayor' */
export const keyLabel = (progression: Progression, tonic: NoteId) =>
  `${tonicOf(progression, tonic).name} mayor`

/** Los compases en la tónica de origen: US2 los transporta y US3 los parte según el compás. */
export const barsOf = (
  progression: Progression,
  _tonic: NoteId,
  _meter: Meter
): RoundChord[][] =>
  progression.bars.split('|').map((bar) =>
    bar
      .trim()
      .split(/\s+/)
      .map((chord) => ({ ...readChord(chord), at: 0 }))
  )
