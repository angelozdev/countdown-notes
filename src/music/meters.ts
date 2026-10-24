import type { Accent } from '@/audio/engine'

export type MeterId =
  | '2/4'
  | '3/4'
  | '4/4'
  | '5/4'
  | '6/8'
  | '7/8'
  | '9/8'
  | '12/8'

export type Meter = {
  id: MeterId
  /** Golpes de metrónomo por compás. */
  beats: number
  /** Lo que dura un golpe, en unidades del BPM. */
  beatLength: number
  /** Golpes de cada grupo de acento; también la cuenta y las marcas. */
  groups: number[]
  /** Si el primer golpe de cada grupo, salvo el primero, lleva acento suave. */
  soft: boolean
}

export const METERS: Meter[] = [
  { id: '2/4', beats: 2, beatLength: 1, groups: [1, 1], soft: false },
  { id: '3/4', beats: 3, beatLength: 1, groups: [1, 1, 1], soft: false },
  { id: '4/4', beats: 4, beatLength: 1, groups: [1, 1, 1, 1], soft: false },
  { id: '5/4', beats: 5, beatLength: 1, groups: [1, 1, 1, 1, 1], soft: false },
  { id: '6/8', beats: 6, beatLength: 1 / 3, groups: [3, 3], soft: true },
  { id: '7/8', beats: 7, beatLength: 1, groups: [2, 2, 3], soft: true },
  { id: '9/8', beats: 9, beatLength: 1 / 3, groups: [3, 3, 3], soft: true },
  { id: '12/8', beats: 12, beatLength: 1 / 3, groups: [3, 3, 3, 3], soft: true }
]

export const METER_BY_ID = Object.fromEntries(
  METERS.map((meter) => [meter.id, meter])
) as Record<MeterId, Meter>

/** El golpe donde empieza cada grupo. */
export const groupStarts = ({ groups }: Meter) =>
  groups.map((_, i) => groups.slice(0, i).reduce((sum, size) => sum + size, 0))

/** El índice del grupo que contiene el golpe. */
export const groupOf = (meter: Meter, beat: number) =>
  groupStarts(meter).findLastIndex((start) => start <= beat)

export function accentAt(meter: Meter, beat: number): Accent {
  if (beat === 0) return 'strong'
  return meter.soft && groupStarts(meter).includes(beat) ? 'soft' : 'none'
}
