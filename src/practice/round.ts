import type { NoteId } from '@/music/notes'

/** Mezcla el pool (Fisher–Yates). La primera nota nunca es avoidFirst, la última de la vuelta anterior. */
export function drawRound(pool: NoteId[], avoidFirst?: NoteId): NoteId[] {
  const notes = [...pool]
  for (let i = notes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[notes[i], notes[j]] = [notes[j], notes[i]]
  }
  if (notes.length > 1 && notes[0] === avoidFirst) {
    const j = 1 + Math.floor(Math.random() * (notes.length - 1))
    ;[notes[0], notes[j]] = [notes[j], notes[0]]
  }
  return notes
}
