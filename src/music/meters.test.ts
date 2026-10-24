import { expect, test } from 'vitest'
import {
  bassAttacks,
  type BassFigure,
  METER_BY_ID,
  type MeterId
} from './meters'

const steps = (count: number, step: number) =>
  Array.from({ length: count }, (_, i) => i * step)

const CASES: [MeterId, Record<BassFigure, number[]>][] = [
  ['2/4', { eighth: steps(4, 0.5), quarter: [0, 1], half: [0], whole: [0] }],
  [
    '3/4',
    { eighth: steps(6, 0.5), quarter: [0, 1, 2], half: [0, 2], whole: [0] }
  ],
  [
    '4/4',
    { eighth: steps(8, 0.5), quarter: [0, 1, 2, 3], half: [0, 2], whole: [0] }
  ],
  [
    '5/4',
    {
      eighth: steps(10, 0.5),
      quarter: [0, 1, 2, 3, 4],
      half: [0, 2, 4],
      whole: [0]
    }
  ],
  ['6/8', { eighth: steps(6, 1), quarter: [0, 3], half: [0], whole: [0] }],
  [
    '7/8',
    { eighth: steps(7, 1), quarter: [0, 2, 4], half: [0, 4], whole: [0] }
  ],
  [
    '9/8',
    { eighth: steps(9, 1), quarter: [0, 3, 6], half: [0, 6], whole: [0] }
  ],
  [
    '12/8',
    { eighth: steps(12, 1), quarter: [0, 3, 6, 9], half: [0, 6], whole: [0] }
  ]
]

const FIGURES: BassFigure[] = ['eighth', 'quarter', 'half', 'whole']

test.each(
  CASES.flatMap(([id, byFigure]) =>
    FIGURES.map((figure): [MeterId, BassFigure, number[]] => [
      id,
      figure,
      byFigure[figure]
    ])
  )
)('en %s con %s el bajo ataca en %j', (id, figure, expected) => {
  const meter = METER_BY_ID[id]
  const attacks = bassAttacks(meter, figure)

  expect(attacks.map(({ at }) => at)).toEqual(expected)
  // cada ataque dura hasta el siguiente, y el último hasta el final del compás
  expect(attacks.map(({ length }) => length)).toEqual(
    expected.map((at, i) => (expected[i + 1] ?? meter.beats) - at)
  )
  expect(attacks.reduce((sum, { length }) => sum + length, 0)).toBe(meter.beats)
})
