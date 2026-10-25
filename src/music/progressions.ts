import { distance } from '@tonaljs/interval'
import { simplify, transpose } from '@tonaljs/note'
import { CHORD_TYPES, type ChordTypeId } from './chords'
import { type Meter, splitAt } from './meters'
import { type Note, type NoteId, spell } from './notes'

export type KeyType = 'major' | 'minor' | 'dorian'
export type ProgressionGroup = 'Ciclos' | 'Jazz' | 'Pop, rock y latino'
export type ProgressionId =
  | 'ii-v-i-mayor'
  | 'ii-v-i-menor'
  | 'turnaround'
  | 'iii-vi-ii-v'
  | 'ciclo-diatonico'
  | 'sustituto-tritonal'
  | 'backdoor'
  | 'blues-jazz'
  | 'blues-menor'
  | 'modal'
  | 'giant-steps'
  | 'i-v-vi-iv'
  | 'vi-iv-i-v'
  | 'doo-wop'
  | 'i-iv-v'
  | 'blues-rock'
  | 'andaluza'
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

const MAJOR = { tonic: 'C', type: 'major' } as const
const MINOR = { tonic: 'C', type: 'minor' } as const

/** En el orden de FR-016, FR-018 y FR-019. */
export const PROGRESSIONS: Progression[] = [
  {
    id: 'ii-v-i-mayor',
    name: 'ii–V–I mayor',
    group: 'Jazz',
    key: MAJOR,
    bars: 'Dm7 | G7 | Cmaj7 | Cmaj7'
  },
  {
    id: 'ii-v-i-menor',
    name: 'ii–V–i menor',
    group: 'Jazz',
    key: MINOR,
    bars: 'Dm7♭5 | G7♭9 | Cm6 | Cm6'
  },
  {
    id: 'turnaround',
    name: 'I–vi–ii–V (turnaround)',
    group: 'Jazz',
    key: MAJOR,
    bars: 'Cmaj7 A7 | Dm7 G7'
  },
  {
    id: 'iii-vi-ii-v',
    name: 'iii–vi–ii–V',
    group: 'Jazz',
    key: MAJOR,
    bars: 'Em7 A7 | Dm7 G7'
  },
  {
    id: 'ciclo-diatonico',
    name: 'Ciclo diatónico (tipo Autumn Leaves)',
    group: 'Jazz',
    key: MAJOR,
    bars: 'Cmaj7 | Fmaj7 | Bm7♭5 | Em7 | Am7 | Dm7 | G7 | Cmaj7'
  },
  {
    id: 'sustituto-tritonal',
    name: 'Sustituto tritonal',
    group: 'Jazz',
    key: MAJOR,
    bars: 'Dm7 | D♭7 | Cmaj7 | Cmaj7'
  },
  {
    id: 'backdoor',
    name: 'ii–V "backdoor"',
    group: 'Jazz',
    key: MAJOR,
    bars: 'Fm7 | B♭7 | Cmaj7 | Cmaj7'
  },
  {
    id: 'blues-jazz',
    name: 'Blues de jazz',
    group: 'Jazz',
    key: MAJOR,
    bars: 'C7 | F7 | C7 | C7 | F7 | F7 | C7 | A7 | Dm7 | G7 | C7 A7 | Dm7 G7'
  },
  {
    id: 'blues-menor',
    name: 'Blues menor',
    group: 'Jazz',
    key: MINOR,
    bars: 'Cm7 ×4 | Fm7 ×2 | Cm7 ×2 | A♭7 | G7 | Cm7 | G7'
  },
  {
    id: 'modal',
    name: 'Modal (tipo So What)',
    group: 'Jazz',
    key: { tonic: 'D', type: 'dorian' },
    bars: 'Dm7 ×8'
  },
  {
    id: 'giant-steps',
    name: 'Coltrane (Giant Steps, avanzado)',
    group: 'Jazz',
    key: MAJOR,
    bars: 'Cmaj7 E♭7 | A♭maj7 B7 | Emaj7 G7 | Cmaj7'
  },
  {
    id: 'i-v-vi-iv',
    name: 'I–V–vi–IV',
    group: 'Pop, rock y latino',
    key: MAJOR,
    bars: 'C | G | Am | F'
  },
  {
    id: 'vi-iv-i-v',
    name: 'vi–IV–I–V',
    group: 'Pop, rock y latino',
    key: MAJOR,
    bars: 'Am | F | C | G'
  },
  {
    id: 'doo-wop',
    name: 'I–vi–IV–V (doo-wop)',
    group: 'Pop, rock y latino',
    key: MAJOR,
    bars: 'C | Am | F | G'
  },
  {
    id: 'i-iv-v',
    name: 'I–IV–V',
    group: 'Pop, rock y latino',
    key: MAJOR,
    bars: 'C | F | G | G'
  },
  {
    id: 'blues-rock',
    name: 'Blues de rock',
    group: 'Pop, rock y latino',
    key: MAJOR,
    bars: 'C7 ×4 | F7 ×2 | C7 ×2 | G7 | F7 | C7 | G7'
  },
  {
    id: 'andaluza',
    name: 'Cadencia andaluza',
    group: 'Pop, rock y latino',
    key: { tonic: 'A', type: 'minor' },
    bars: 'Am | G | F | E'
  }
]

export const PROGRESSION_BY_ID = Object.fromEntries(
  PROGRESSIONS.map((progression) => [progression.id, progression])
) as Record<ProgressionId, Progression>

const MINOR_TONICS: Record<NoteId, string> = {
  C: 'C',
  Db: 'C#',
  D: 'D',
  Eb: 'Eb',
  E: 'E',
  F: 'F',
  Gb: 'F#',
  G: 'G',
  Ab: 'G#',
  A: 'A',
  Bb: 'Bb',
  B: 'B'
}

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
  },
  minor: MINOR_TONICS,
  dorian: MINOR_TONICS
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

const KEY_TYPE_NAMES: Record<KeyType, string> = {
  major: 'mayor',
  minor: 'menor',
  dorian: 'dórico'
}

/** 'Fa mayor', 'Do sostenido menor', 'Re dórico' */
export const keyLabel = (progression: Progression, tonic: NoteId) =>
  `${tonicOf(progression, tonic).name} ${KEY_TYPE_NAMES[progression.key.type]}`

/** Los compases transportados a la tónica; un compás con dos acordes parte en `splitAt(meter)`. */
export const barsOf = (
  progression: Progression,
  tonic: NoteId,
  meter: Meter
): RoundChord[][] => {
  const interval = distance(
    progression.key.tonic,
    TONICS[progression.key.type][tonic]
  )
  return progression.bars.split('|').flatMap((bar) => {
    const [, symbols, repeat] = /^(.*?)(?:\s*×(\d+))?$/.exec(bar.trim())!
    const chords = symbols.split(/\s+/)
    if (chords.length > 2) throw new Error(`Más de dos acordes en: ${bar}`)
    const chordBar = chords.map((chord, i) => {
      const { root, type } = readChord(chord)
      // simplify evita E♯, B♯, C♭, F♭ y las dobles alteraciones (FR-013).
      return {
        root: spell(simplify(transpose(root, interval))),
        type,
        at: i === 0 ? 0 : splitAt(meter)
      }
    })
    return Array.from({ length: Number(repeat ?? 1) }, () => chordBar)
  })
}
