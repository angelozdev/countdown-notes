import { screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { renderApp, type FakeEngine } from '@/test/app'

// FR-025: cifrado y nombre en español de cada raíz
const NAMES: Record<string, [string, string]> = {
  C: ['C', 'Do'],
  Db: ['D♭', 'Re bemol'],
  D: ['D', 'Re'],
  Eb: ['E♭', 'Mi bemol'],
  E: ['E', 'Mi'],
  F: ['F', 'Fa'],
  Gb: ['F♯', 'Fa sostenido'],
  G: ['G', 'Sol'],
  Ab: ['A♭', 'La bemol'],
  A: ['A', 'La'],
  Bb: ['B♭', 'Si bemol'],
  B: ['B', 'Si']
}

function bassByBar(fake: FakeEngine) {
  return new Map(
    fake.played.flatMap(({ bar, sound }) =>
      sound.kind === 'bass' ? [[bar, sound.pitch] as const] : []
    )
  )
}

async function play(app: ReturnType<typeof renderApp>) {
  await app.user.click(screen.getByRole('button', { name: 'Play' }))
}

test('el bajo no suena en la cuenta y toca la raíz en el tiempo 1 de cada compás', async () => {
  const app = renderApp()
  await play(app)
  app.fake.beat(4 + 4 * 4)

  const bass = app.fake.played.filter(({ sound }) => sound.kind === 'bass')
  expect(bass.map(({ bar, beat }) => [bar, beat])).toEqual([
    [1, 0],
    [2, 0],
    [3, 0],
    [4, 0]
  ])
  for (const pitch of bassByBar(app.fake).values()) {
    expect(pitch).toMatch(/^(C|Db|D|Eb|E|F|Gb|G|Ab|A|Bb|B)2$/)
  }
})

test('la nota cambia cada 2 compases, en el tiempo 1', async () => {
  const app = renderApp()
  await play(app)
  app.fake.beat(4 + 4 * 4)

  const bass = bassByBar(app.fake)
  expect(bass.get(2)).toBe(bass.get(1))
  expect(bass.get(4)).toBe(bass.get(3))
  expect(bass.get(3)).not.toBe(bass.get(1))
})

test('cada vuelta tiene las 12 notas una vez y nunca suena la misma dos veces seguidas', async () => {
  const app = renderApp()
  await play(app)
  app.fake.beat(4 + 3 * 24 * 4)

  const bass = bassByBar(app.fake)
  const notes = Array.from({ length: 36 }, (_, k) => bass.get(1 + 2 * k))
  for (let round = 0; round < 3; round++) {
    expect(new Set(notes.slice(round * 12, round * 12 + 12)).size).toBe(12)
  }
  for (let k = 1; k < notes.length; k++) {
    expect(notes[k]).not.toBe(notes[k - 1])
  }
})

test('"Ahora" muestra la nota con su nombre en español', async () => {
  const app = renderApp()
  await play(app)
  app.fake.beat(5)

  const id = bassByBar(app.fake).get(1)!.slice(0, -1)
  const [label, name] = NAMES[id]
  const now = within(screen.getByRole('region', { name: 'Ahora' }))
  expect(now.getByText(label)).toBeDefined()
  expect(now.getByText(name)).toBeDefined()
})

test('compases por nota empieza en 2 y se limita a 1–16', async () => {
  const { openSettings, typeNumber } = renderApp()
  const panel = await openSettings()
  const bars = panel.getByRole('spinbutton', { name: 'Compases por nota' })
  expect(bars).toHaveProperty('value', '2')

  await typeNumber(bars, '20')
  expect(bars).toHaveProperty('value', '16')
  await typeNumber(bars, '0')
  expect(bars).toHaveProperty('value', '1')
})

test('cambiar compases por nota mientras suena aplica desde la siguiente vuelta', async () => {
  const app = renderApp()
  await play(app)
  app.fake.beat(4)
  const panel = await app.openSettings()
  await app.typeNumber(
    panel.getByRole('spinbutton', { name: 'Compases por nota' }),
    '1'
  )
  await app.closeSettings()
  app.fake.beat(36 * 4)

  const bass = bassByBar(app.fake)
  // vuelta 1: cada nota dura 2 compases
  const first = Array.from({ length: 12 }, (_, k) => bass.get(1 + 2 * k))
  for (let k = 0; k < 12; k++) expect(bass.get(2 + 2 * k)).toBe(first[k])
  for (let k = 1; k < 12; k++) expect(first[k]).not.toBe(first[k - 1])
  // vuelta 2: una nota por compás
  const second = Array.from({ length: 12 }, (_, k) => bass.get(25 + k))
  expect(new Set(second).size).toBe(12)
})
