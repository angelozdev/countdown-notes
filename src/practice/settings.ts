import { z } from 'zod'
import type { Mix } from '@/audio/engine'
import { type BassFigure, METERS, type MeterId } from '@/music/meters'
import { NOTES, type NoteId } from '@/music/notes'

/** Los ajustes que se recuerdan en el dispositivo (data-model.md, "Ajustes"). */
export type Settings = {
  bpm: number
  barsPerNote: number
  notes: NoteId[]
  meter: MeterId
  bassFigure: BassFigure
  bassOctave: 1 | 2 | 3
  mix: Mix
  /** Parar tras `count` vueltas, si `on`. */
  repeats: { on: boolean; count: number }
}

export const SETTINGS_KEY = 'countdown-notes:ajustes'

export const DEFAULT_SETTINGS: Settings = {
  bpm: 60,
  barsPerNote: 2,
  notes: NOTES.map((note) => note.id),
  meter: '4/4',
  bassFigure: 'whole',
  bassOctave: 2,
  mix: {
    click: { volume: 80, muted: false },
    bass: { volume: 80, muted: false },
    chord: { volume: 80, muted: false }
  },
  repeats: { on: false, count: 10 }
}

const D = DEFAULT_SETTINGS

const channel = (fallback: Mix['click']) =>
  z
    .object({
      volume: z.number().int().min(0).max(100).catch(fallback.volume),
      muted: z.boolean().catch(fallback.muted)
    })
    .catch(fallback)

// cada campo vuelve solo a su valor por defecto, y el objeto entero también
export const settingsSchema = z
  .object({
    bpm: z.number().int().min(30).max(240).catch(D.bpm),
    barsPerNote: z.number().int().min(1).max(16).catch(D.barsPerNote),
    notes: z
      .array(z.enum(NOTES.map((note) => note.id)))
      // únicas y en orden cromático
      .transform((ids) =>
        NOTES.filter((note) => ids.includes(note.id)).map((note) => note.id)
      )
      .catch(D.notes),
    meter: z.enum(METERS.map((meter) => meter.id)).catch(D.meter),
    bassFigure: z
      .enum(['eighth', 'quarter', 'half', 'whole'])
      .catch(D.bassFigure),
    bassOctave: z
      .union([z.literal(1), z.literal(2), z.literal(3)])
      .catch(D.bassOctave),
    mix: z
      .object({
        click: channel(D.mix.click),
        bass: channel(D.mix.bass),
        chord: channel(D.mix.chord)
      })
      .catch(D.mix),
    repeats: z
      .object({
        on: z.boolean().catch(D.repeats.on),
        count: z.number().int().min(1).max(999).catch(D.repeats.count)
      })
      .catch(D.repeats)
  })
  .catch(D)

/** Lee y valida lo guardado; sin datos, de otra versión, rotos o sin almacenamiento, los valores por defecto. */
export function loadSettings(): Settings {
  try {
    const data = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? 'null')
    return data?.version === 1 ? settingsSchema.parse(data.settings) : D
  } catch {
    return D
  }
}

export function saveSettings(settings: Settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ version: 1, settings }))
  } catch {
    // sin almacenamiento la app sigue igual, sin recordar
  }
}
