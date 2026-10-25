import { distance } from '@tonaljs/interval'
import { simplify, transpose } from '@tonaljs/note'
import { CHORD_TYPES, type ChordTypeId } from './chords'
import { type Meter, splitAt } from './meters'
import { type Note, NOTES, type NoteId, spell } from './notes'
import { formatProgression, type WrittenBar } from './progression-text'

export type KeyType = 'major' | 'minor' | 'dorian'
export type ProgressionGroup =
  | 'Mis progresiones'
  | 'Ciclos'
  | 'Jazz'
  | 'Pop, rock y latino'
export type ProgressionId =
  | 'ciclo-cuartas'
  | 'ciclo-quintas'
  | 'ii-v-i-12'
  | 'dominantes-encadenados'
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
export type MyProgressionId = `propia-${number}`
export type RoundChord = { root: Note; type?: ChordTypeId; at: number }

/** Una progresión escrita por el usuario, en su tonalidad de origen. */
export type MyProgression = {
  id: MyProgressionId
  name: string
  key: { tonic: NoteId; type: 'major' | 'minor' }
  bars: WrittenBar[]
}

export type Progression = {
  id: ProgressionId | MyProgressionId
  name: string
  group: ProgressionGroup
  key: { tonic: string; type: KeyType }
  bars: string
  cycle?: 'fourths' | 'fifths'
  rootsOnly?: true
}

const MAJOR = { tonic: 'C', type: 'major' } as const
const MINOR = { tonic: 'C', type: 'minor' } as const

/** En el orden de FR-016, FR-018 y FR-019. El id queda `ProgressionId`, no el ancho: el `z.enum` de settings.ts lo necesita. */
export const PROGRESSIONS: (Progression & { id: ProgressionId })[] = [
  {
    id: 'ciclo-cuartas',
    name: 'Ciclo de cuartas',
    group: 'Ciclos',
    key: MAJOR,
    bars: 'C ×2',
    cycle: 'fourths',
    rootsOnly: true
  },
  {
    id: 'ciclo-quintas',
    name: 'Ciclo de quintas',
    group: 'Ciclos',
    key: MAJOR,
    bars: 'C ×2',
    cycle: 'fifths',
    rootsOnly: true
  },
  {
    id: 'ii-v-i-12',
    name: 'ii–V–I por las 12 tonalidades',
    group: 'Ciclos',
    key: MAJOR,
    bars: 'Dm7 | G7 | Cmaj7 | Cmaj7',
    cycle: 'fourths'
  },
  {
    id: 'dominantes-encadenados',
    name: 'Dominantes encadenados',
    group: 'Ciclos',
    key: MAJOR,
    bars: 'E7 | A7 | D7 | G7 | Cmaj7 | Cmaj7'
  },
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

/** Una progresión propia como una de la biblioteca: lo que leen barsOf, tonicOf y keyLabel. */
export const myProgression = ({
  id,
  name,
  key,
  bars
}: MyProgression): Progression => ({
  id,
  name,
  group: 'Mis progresiones',
  key: { tonic: TONICS[key.type][key.tonic], type: key.type },
  bars: formatProgression(bars)
})

/** La tabla de los ciclos por cuartas (research §5): como la mayor, pero G♭ en vez de F♯. */
const FOURTHS_TONICS: Record<NoteId, string> = { ...TONICS.major, Gb: 'Gb' }

/** La tabla con la que se escribe la tónica de la progresión: la de su tipo, o la de cuartas. */
const tableOf = ({ cycle, key }: Progression) =>
  cycle === 'fourths' ? FOURTHS_TONICS : TONICS[key.type]

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
  spell(tableOf(progression)[tonic])

const KEY_TYPE_NAMES: Record<KeyType, string> = {
  major: 'mayor',
  minor: 'menor',
  dorian: 'dórico'
}

/** 'Fa mayor', 'Do sostenido menor', 'Re dórico'; en los ciclos de 12, 'desde Fa' */
export const keyLabel = (progression: Progression, tonic: NoteId) =>
  progression.cycle
    ? `desde ${tonicOf(progression, tonic).name}`
    : `${tonicOf(progression, tonic).name} ${KEY_TYPE_NAMES[progression.key.type]}`

/** Los compases transportados a la tónica `destination` (formato de tonal); un compás con dos acordes parte en `splitAt(meter)`. */
const transposed = (
  progression: Progression,
  destination: string,
  meter: Meter
): RoundChord[][] => {
  const interval = distance(progression.key.tonic, destination)
  return progression.bars.split('|').flatMap((bar) => {
    const [, symbols, repeat] = /^(.*?)(?:\s*×(\d+))?$/.exec(bar.trim())!
    const chords = symbols.split(/\s+/)
    if (chords.length > 2) throw new Error(`Más de dos acordes en: ${bar}`)
    const chordBar = chords.map((chord, i) => {
      const { root, type } = readChord(chord)
      // simplify evita E♯, B♯, C♭, F♭ y las dobles alteraciones (FR-013).
      return {
        root: spell(simplify(transpose(root, interval))),
        ...(progression.rootsOnly ? {} : { type }),
        at: i === 0 ? 0 : splitAt(meter)
      }
    })
    return Array.from({ length: Number(repeat ?? 1) }, () => chordBar)
  })
}

/** Los compases transportados a la tónica; en los ciclos, la unidad por las 12 tónicas desde ella. */
export const barsOf = (
  progression: Progression,
  tonic: NoteId,
  meter: Meter
): RoundChord[][] => {
  const table = tableOf(progression)
  if (!progression.cycle) {
    return transposed(progression, table[tonic], meter)
  }
  const step = progression.cycle === 'fourths' ? 5 : 7
  const start = NOTES.findIndex(({ id }) => id === tonic)
  return Array.from({ length: 12 }, (_, k) =>
    transposed(progression, table[NOTES[(start + k * step) % 12].id], meter)
  ).flat()
}
