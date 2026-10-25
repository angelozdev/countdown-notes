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

type Word = { text: string; start: number }
/** Un compás del texto: sus palabras y el trozo (`start`–`end`) que ocupa entre barras. */
type Piece = { words: Word[]; start: number; end: number }

const wordsOf = (text: string, offset: number): Word[] =>
  Array.from(text.matchAll(/\S+/g), (match) => ({
    text: match[0],
    start: offset + match.index
  }))

/** Sin `|`, un compás por palabra; con `|`, un compás por trozo, y una barra al borde es opcional. */
function piecesOf(text: string): Piece[] {
  if (!text.includes('|')) {
    return wordsOf(text, 0).map((word) => ({
      words: [word],
      start: word.start,
      end: word.start + word.text.length
    }))
  }
  let start = 0
  const pieces = text.split('|').map((chunk) => {
    const end = start + chunk.length
    const piece = { words: wordsOf(chunk, start), start, end }
    start = end + 1
    return piece
  })
  return pieces.filter(
    ({ words }, i) => words.length > 0 || (i > 0 && i < pieces.length - 1)
  )
}

/** El texto del editor: sin `|`, un acorde por compás; con `|`, compases de 1 o 2 acordes. */
export function parseProgression(
  text: string
): { bars: WrittenBar[] } | { errors: TextError[] } {
  const bars: WrittenBar[] = []
  const errors: TextError[] = []
  const pieces = piecesOf(text)
  for (const { words, start, end } of pieces) {
    if (words.length === 0) {
      // el trozo vacío, con las dos barras que lo rodean
      errors.push({
        start: start - 1,
        end: end + 1,
        message: 'Hay un compás vacío entre dos barras.'
      })
    } else if (words.length > 2) {
      const first = words[0].start
      const last = words[words.length - 1]
      const lastEnd = last.start + last.text.length
      errors.push({
        start: first,
        end: lastEnd,
        message: `Un compás tiene uno o dos acordes: «${text.slice(first, lastEnd)}».`
      })
    } else {
      const bar: WrittenBar = []
      for (const word of words) {
        const chord = readChord(word.text)
        if (chord) bar.push(chord)
        else {
          errors.push({
            start: word.start,
            end: word.start + word.text.length,
            message: `No reconozco «${word.text}».`
          })
        }
      }
      bars.push(bar)
    }
  }
  if (pieces.length === 0) {
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
