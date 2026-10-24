import { screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { NOTES } from '@/music/notes'
import { renderApp } from '@/test/app'

// FR-005 y FR-012: las 25 opciones, por familia y en orden, sobre Do
const FAMILIES: [string, string[]][] = [
  [
    'Tríadas',
    [
      'C · mayor',
      'Cm · menor',
      'Cdim · disminuido',
      'Caug · aumentado',
      'Csus4 · con cuarta suspendida',
      'Csus2 · con segunda suspendida'
    ]
  ],
  ['Sextas', ['C6 · sexta', 'Cm6 · menor sexta', 'C6/9 · sexta novena']],
  [
    'Séptimas',
    [
      'Cmaj7 · séptima mayor',
      'Cm7 · menor séptima',
      'C7 · séptima',
      'Cm7♭5 · semidisminuido',
      'C°7 · disminuido séptima',
      'Cm(maj7) · menor séptima mayor',
      'C7sus4 · séptima con cuarta suspendida'
    ]
  ],
  [
    'Extensiones',
    [
      'Cmaj9 · novena mayor',
      'Cm9 · menor novena',
      'C9 · novena',
      'Cm11 · menor oncena',
      'C13 · trecena'
    ]
  ],
  [
    'Dominantes alterados',
    [
      'C7♭9 · séptima novena bemol',
      'C7♯9 · séptima novena sostenida',
      'C7♯11 · séptima oncena sostenida',
      'C7alt · séptima alterada'
    ]
  ]
]

const NAMES = Object.fromEntries(
  NOTES.map(({ id, label, name }) => [id, [label, name]])
)

test('el selector ofrece los 25 tipos, en 5 familias y en orden', async () => {
  const app = renderApp()
  const panel = await app.openSettings()
  await app.user.click(panel.getByRole('radio', { name: 'Bajo + acorde' }))
  const type = within(panel.getByRole('combobox', { name: 'Tipo de acorde' }))

  const groups = type.getAllByRole('group')
  expect(groups).toHaveLength(FAMILIES.length)
  FAMILIES.forEach(([family, options], index) => {
    expect(groups[index]).toBe(type.getByRole('group', { name: family }))
    expect(
      within(groups[index])
        .getAllByRole('option')
        .map((option) => option.textContent)
    ).toEqual(options)
  })
})

test('"Ahora" muestra el cifrado y el nombre de un tipo de séptima', async () => {
  const app = renderApp()
  const panel = await app.openSettings()
  await app.user.click(panel.getByRole('radio', { name: 'Bajo + acorde' }))
  await app.user.selectOptions(
    panel.getByRole('combobox', { name: 'Tipo de acorde' }),
    'Cm7♭5 · semidisminuido'
  )
  await app.closeSettings()
  await app.user.click(screen.getByRole('button', { name: 'Play' }))
  app.fake.beat(4 + 1)

  const bass = app.fake.played.find(
    ({ bar, sound }) => bar === 1 && sound.kind === 'bass'
  )
  const [label, name] =
    NAMES[bass!.sound.kind === 'bass' ? bass!.sound.pitch.slice(0, -1) : '']
  const now = within(screen.getByRole('region', { name: 'Ahora' }))
  expect(now.getByText(`${label}m7♭5`)).toBeDefined()
  expect(now.getByText(`${name} semidisminuido`)).toBeDefined()
})
