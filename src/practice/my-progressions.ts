import { z } from 'zod'
import { CHORD_TYPES } from '@/music/chords'
import { NOTES } from '@/music/notes'
import type { MyProgression, MyProgressionId } from '@/music/progressions'

export const MY_PROGRESSIONS_KEY = 'countdown-notes:progresiones'

export const myProgressionId = z
  .string()
  .refine((id): id is MyProgressionId => /^propia-\d+$/.test(id))

const chord = z.object({
  // el formato de tonal: letra mayúscula y # o b
  root: z.string().regex(/^[A-G][#b]?$/),
  type: z.enum(CHORD_TYPES.map((type) => type.id))
})

export const myProgressionSchema = z.object({
  id: myProgressionId,
  name: z.string().trim().min(1),
  key: z.object({
    tonic: z.enum(NOTES.map((note) => note.id)),
    type: z.enum(['major', 'minor'])
  }),
  bars: z.array(z.array(chord).min(1).max(2)).min(1)
})

/** Lee y valida lo guardado, una por una; sin datos, de otra versión, rotos o sin almacenamiento, `[]`. */
export function loadMyProgressions(): MyProgression[] {
  try {
    const data = JSON.parse(localStorage.getItem(MY_PROGRESSIONS_KEY) ?? 'null')
    if (data?.version !== 1 || !Array.isArray(data.progressions)) return []
    const mine: MyProgression[] = []
    for (const item of data.progressions as unknown[]) {
      const result = myProgressionSchema.safeParse(item)
      // si un id se repite, gana la primera
      if (result.success && !mine.some(({ id }) => id === result.data.id)) {
        mine.push(result.data)
      }
    }
    return mine
  } catch {
    return []
  }
}

export function saveMyProgressions(progressions: MyProgression[]) {
  try {
    localStorage.setItem(
      MY_PROGRESSIONS_KEY,
      JSON.stringify({ version: 1, progressions })
    )
  } catch {
    // sin almacenamiento la app sigue igual, sin recordar
  }
}
