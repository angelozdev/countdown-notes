import { simplify } from '@tonaljs/note'
import { CHORD_TYPES, chordSymbol, type ChordTypeId } from './chords'
import { spell } from './notes'

/** La raíz en el formato de tonal ('Bb', 'F#'), como se escribió en la tonalidad de origen. */
export type WrittenChord = { root: string; type: ChordTypeId }
export type WrittenBar = WrittenChord[]
export type TextError = { start: number; end: number; message: string }

/** Cifrados que se aceptan además del `suffix` de cada tipo. */
const ALIASES = new Map([
  ['ø', 'm7♭5'],
  ['ø7', 'm7♭5'],
  ['o7', '°7'],
  ['dim7', '°7']
])

/** 'bbm7b5' → raíz 'Bb', tipo m7b5; undefined si no es un acorde. */
function readChord(word: string): WrittenChord | undefined {
  const match = /^([A-Ga-g])([#b♯♭]?)(.*)$/u.exec(word)
  if (!match) return undefined
  const [, letter, accidental, rest] = match
  // Ningún sufijo de la lista tiene la letra b, así que la b del sufijo siempre es un bemol.
  const suffix = rest.replace(/b/g, '♭').replace(/#/g, '♯')
  const type = CHORD_TYPES.find(
    (candidate) => candidate.suffix === (ALIASES.get(suffix) ?? suffix)
  )
  if (!type) return undefined
  const root =
    letter.toUpperCase() + accidental.replace('♭', 'b').replace('♯', '#')
  return { root: simplify(root), type: type.id }
}

/** El texto del editor: sin `|`, un acorde por compás. */
export function parseProgression(
  text: string
): { bars: WrittenBar[] } | { errors: TextError[] } {
  const bars: WrittenBar[] = []
  const errors: TextError[] = []
  for (const { 0: word, index } of text.matchAll(/\S+/g)) {
    const chord = readChord(word)
    if (chord) bars.push([chord])
    else {
      errors.push({
        start: index,
        end: index + word.length,
        message: `No reconozco «${word}».`
      })
    }
  }
  if (bars.length + errors.length === 0) {
    errors.push({
      start: 0,
      end: text.length,
      message: 'Escribe al menos un acorde.'
    })
  }
  return errors.length > 0 ? { errors } : { bars }
}

/** 'Cmaj7 | C7 A7 | Dm7 G7', con el cifrado de la app. */
export const formatProgression = (bars: WrittenBar[]) =>
  bars
    .map((bar) =>
      bar.map(({ root, type }) => chordSymbol(spell(root), type)).join(' ')
    )
    .join(' | ')
