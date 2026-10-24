import { screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { renderApp, type FakeEngine } from '@/test/app'

type App = ReturnType<typeof renderApp>

async function choose(app: App, group: string, name: string) {
  const panel = await app.openSettings()
  await app.user.click(
    within(panel.getByRole('radiogroup', { name: group })).getByRole('radio', {
      name
    })
  )
  await app.closeSettings()
}

/** Los ataques del bajo de ese compás: en qué golpe y con qué altura. */
const bassOf = (fake: FakeEngine, bar: number) =>
  fake.played.flatMap(({ bar: b, beat, sound }) =>
    b === bar && sound.kind === 'bass' ? [{ beat, pitch: sound.pitch }] : []
  )

const checked = (radios: HTMLElement[]) =>
  radios.filter((radio) => radio.getAttribute('aria-checked') === 'true')

test('la figura empieza en redondas y la octava en 2', async () => {
  const app = renderApp()
  const panel = await app.openSettings()
  const radiosOf = (group: string) =>
    within(panel.getByRole('radiogroup', { name: group })).getAllByRole('radio')
  const figures = radiosOf('Figura del bajo')
  const octaves = radiosOf('Octava del bajo')

  expect(figures.map((radio) => radio.textContent)).toEqual([
    'Corcheas',
    'Negras',
    'Blancas',
    'Redondas'
  ])
  expect(octaves.map((radio) => radio.textContent)).toEqual(['1', '2', '3'])
  expect(checked(figures)).toEqual([
    panel.getByRole('radio', { name: 'Redondas' })
  ])
  expect(checked(octaves)).toEqual([panel.getByRole('radio', { name: '2' })])
})

test.each([
  ['Corcheas', 8],
  ['Negras', 4],
  ['Blancas', 2],
  ['Redondas', 1]
])('en 4/4 con %s el bajo ataca %i veces por compás', async (figure, count) => {
  const app = renderApp()
  await choose(app, 'Figura del bajo', figure)
  await app.user.click(screen.getByRole('button', { name: 'Play' }))
  app.fake.beat(4 + 4)

  const bass = bassOf(app.fake, 1)
  expect(bass).toHaveLength(count)
  expect(bass[0].beat).toBe(0)
  expect(new Set(bass.map(({ pitch }) => pitch)).size).toBe(1)
})

test.each(['3', '1'])(
  'la octava %s cambia la altura del bajo',
  async (octave) => {
    const app = renderApp()
    await choose(app, 'Octava del bajo', octave)
    await app.user.click(screen.getByRole('button', { name: 'Play' }))
    app.fake.beat(5)

    const bass = bassOf(app.fake, 1)
    expect(bass).toHaveLength(1)
    expect(bass[0].pitch.endsWith(octave)).toBe(true)
  }
)

test('figura y octava cambiadas mientras suena aplican desde el siguiente compás', async () => {
  const app = renderApp()
  await app.user.click(screen.getByRole('button', { name: 'Play' }))
  app.fake.beat(4 + 1)
  await choose(app, 'Figura del bajo', 'Negras')
  await choose(app, 'Octava del bajo', '3')
  app.fake.beat(3 + 4)

  const first = bassOf(app.fake, 1)
  const second = bassOf(app.fake, 2)
  expect(first).toHaveLength(1)
  expect(first[0].pitch.endsWith('2')).toBe(true)
  expect(second).toHaveLength(4)
  expect(second.every(({ pitch }) => pitch.endsWith('3'))).toBe(true)
})
