import { screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { renderApp, type FakeEngine } from '@/test/app'

const LABELS = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B']
const BLACK = ['D♭', 'E♭', 'F♯', 'A♭', 'B♭']
const NATURAL_PITCHES = ['C2', 'D2', 'E2', 'F2', 'G2', 'A2', 'B2']

function bassByBar(fake: FakeEngine) {
  return new Map(
    fake.played.flatMap(({ bar, sound }) =>
      sound.kind === 'bass' ? [[bar, sound.pitch] as const] : []
    )
  )
}

function pitchesInBars(fake: FakeEngine, from: number, to: number) {
  const bass = bassByBar(fake)
  return new Set(
    Array.from({ length: to - from + 1 }, (_, k) => bass.get(from + k))
  )
}

async function openNotes(app: ReturnType<typeof renderApp>) {
  const panel = await app.openSettings()
  return { panel, notes: within(panel.getByRole('group', { name: 'Notas' })) }
}

const pressed = (button: HTMLElement) => button.getAttribute('aria-pressed')

test('las 12 notas empiezan incluidas, con la grafía de las negras', async () => {
  const { notes } = await openNotes(renderApp())
  const buttons = notes.getAllByRole('button')
  expect(buttons.map((button) => button.textContent)).toEqual(LABELS)
  expect(buttons.map(pressed)).toEqual(LABELS.map(() => 'true'))
})

test('una nota se excluye y se vuelve a incluir', async () => {
  const app = renderApp()
  const { notes } = await openNotes(app)
  const fSharp = notes.getByRole('button', { name: 'F♯' })
  await app.user.click(fSharp)
  expect(pressed(fSharp)).toBe('false')
  await app.user.click(fSharp)
  expect(pressed(fSharp)).toBe('true')
})

test('los atajos incluyen o excluyen naturales y alteradas, y se deshabilitan si no cambiarían nada', async () => {
  const app = renderApp()
  const { panel, notes } = await openNotes(app)
  const shortcut = (name: string) => panel.getByRole('button', { name })

  expect(shortcut('Incluir naturales')).toHaveProperty('disabled', true)
  expect(shortcut('Incluir alteradas')).toHaveProperty('disabled', true)
  expect(shortcut('Excluir naturales')).toHaveProperty('disabled', false)
  expect(shortcut('Excluir alteradas')).toHaveProperty('disabled', false)

  await app.user.click(shortcut('Excluir alteradas'))
  for (const label of BLACK) {
    expect(pressed(notes.getByRole('button', { name: label }))).toBe('false')
  }
  expect(shortcut('Excluir alteradas')).toHaveProperty('disabled', true)
  expect(shortcut('Incluir alteradas')).toHaveProperty('disabled', false)

  await app.user.click(shortcut('Incluir alteradas'))
  expect(notes.getAllByRole('button').map(pressed)).toEqual(
    LABELS.map(() => 'true')
  )
})

test('con solo naturales, la vuelta tiene las 7 naturales', async () => {
  const app = renderApp()
  const { panel } = await openNotes(app)
  await app.user.click(panel.getByRole('button', { name: 'Excluir alteradas' }))
  await app.closeSettings()
  await app.user.click(screen.getByRole('button', { name: 'Play' }))
  app.fake.beat(4 + 7 * 2 * 4)

  expect(pitchesInBars(app.fake, 1, 14)).toEqual(new Set(NATURAL_PITCHES))
})

test('con menos de 2 notas no se puede dar Play, y se explica por qué', async () => {
  const app = renderApp()
  const { panel, notes } = await openNotes(app)
  await app.user.click(panel.getByRole('button', { name: 'Excluir naturales' }))
  await app.user.click(panel.getByRole('button', { name: 'Excluir alteradas' }))
  await app.user.click(notes.getByRole('button', { name: 'C' }))
  expect(panel.getByText('Elige al menos 2 notas para tocar.')).toBeDefined()

  await app.closeSettings()
  expect(screen.getByRole('button', { name: 'Play' })).toHaveProperty(
    'disabled',
    true
  )
  expect(screen.getByText('Elige al menos 2 notas para tocar.')).toBeDefined()
})

test('los filtros cambiados mientras suena aplican desde la siguiente vuelta', async () => {
  const app = renderApp()
  await app.user.click(screen.getByRole('button', { name: 'Play' }))
  app.fake.beat(4)
  const { panel } = await openNotes(app)
  await app.user.click(panel.getByRole('button', { name: 'Excluir alteradas' }))
  await app.closeSettings()
  app.fake.beat((24 + 14) * 4)

  expect(pitchesInBars(app.fake, 1, 24).size).toBe(12)
  expect(pitchesInBars(app.fake, 25, 38)).toEqual(new Set(NATURAL_PITCHES))
})

test('con menos de 2 notas mientras suena, la música sigue con las notas anteriores', async () => {
  const app = renderApp()
  await app.user.click(screen.getByRole('button', { name: 'Play' }))
  app.fake.beat(4)
  const { panel } = await openNotes(app)
  await app.user.click(panel.getByRole('button', { name: 'Excluir naturales' }))
  await app.user.click(panel.getByRole('button', { name: 'Excluir alteradas' }))
  await app.closeSettings()
  app.fake.beat((24 + 24) * 4)

  expect(app.fake.running).toBe(true)
  expect(pitchesInBars(app.fake, 25, 48).size).toBe(12)
})
