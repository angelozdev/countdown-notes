import { expect, test } from 'vitest'
import type { NoteId } from '@/music/notes'
import { drawRound } from './round'

const ALL: NoteId[] = [
  'C',
  'Db',
  'D',
  'Eb',
  'E',
  'F',
  'Gb',
  'G',
  'Ab',
  'A',
  'Bb',
  'B'
]

function chain(pool: NoteId[], rounds: number) {
  const result = [drawRound(pool)]
  while (result.length < rounds)
    result.push(drawRound(pool, result.at(-1)!.at(-1)))
  return result
}

test('cada vuelta tiene cada nota del pool exactamente una vez, con cualquier pool de 2 a 12 notas', () => {
  for (let size = 2; size <= 12; size++) {
    const pool = ALL.slice(0, size)
    for (const round of chain(pool, 100)) {
      expect(round.toSorted()).toEqual(pool.toSorted())
    }
  }
})

test('en 1.000 vueltas seguidas, la primera nunca repite la última de la anterior', () => {
  const rounds = chain(ALL, 1000)
  for (let k = 1; k < rounds.length; k++) {
    expect(rounds[k][0]).not.toBe(rounds[k - 1].at(-1))
  }
})

test('con 2 notas, las vueltas alternan sin repetir', () => {
  const notes = chain(['C', 'Db'], 100).flat()
  for (let k = 1; k < notes.length; k++) {
    expect(notes[k]).not.toBe(notes[k - 1])
  }
})
