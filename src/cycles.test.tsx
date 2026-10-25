import { screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { voicingOf } from '@/music/chords'
import { renderApp, type FakeEngine } from '@/test/app'

type App = ReturnType<typeof renderApp>

const CYCLES = [
  'Ciclo de cuartas',
  'Ciclo de quintas',
  'ii–V–I por las 12 tonalidades',
  'Dominantes encadenados'
]

/** Abre el panel, toca un radio de un grupo y lo cierra. */
async function pick(app: App, group: string, name: string) {
  const panel = await app.openSettings()
  await app.user.click(
    within(panel.getByRole('radiogroup', { name: group })).getByRole('radio', {
      name
    })
  )
  await app.closeSettings()
}

const pickMode = (app: App, name: string) => pick(app, 'Modo', name)
const pickTonic = (app: App, name: string) => pick(app, 'Tonalidad', name)
const pickSound = (app: App, name: string) => pick(app, 'Qué suena', name)

async function pickProgression(app: App, name: string) {
  const panel = await app.openSettings()
  await app.user.selectOptions(
    panel.getByRole('combobox', { name: 'Progresión' }),
    name
  )
  await app.closeSettings()
}

async function pickChordType(app: App, name: string) {
  const panel = await app.openSettings()
  await app.user.selectOptions(
    panel.getByRole('combobox', { name: 'Tipo de acorde' }),
    name
  )
  await app.closeSettings()
}

const chordsOf = (fake: FakeEngine, bar: number) =>
  fake.played.filter(
    (event) => event.bar === bar && event.sound.kind === 'chord'
  )

/** Las alturas del acorde que suena en el compás `bar`. */
const chordPitches = (fake: FakeEngine, bar: number) =>
  chordsOf(fake, bar).flatMap(({ sound }) =>
    sound.kind === 'chord' ? [sound.pitches] : []
  )[0]

const bars = () =>
  within(screen.getByRole('list', { name: 'Carril' })).getAllByRole('listitem')

const nowRegion = () => within(screen.getByRole('region', { name: 'Ahora' }))

async function play(app: App) {
  await app.user.click(screen.getByRole('button', { name: 'Play' }))
}

test('el grupo Ciclos va primero', async () => {
  const app = renderApp()
  await pickMode(app, 'Progresión')
  const panel = await app.openSettings()
  const select = within(panel.getByRole('combobox', { name: 'Progresión' }))

  const groups = select.getAllByRole('group')
  expect(groups).toHaveLength(3)
  ;['Ciclos', 'Jazz', 'Pop, rock y latino'].forEach((name, index) => {
    expect(groups[index]).toBe(select.getByRole('group', { name }))
  })
  expect(
    within(groups[0])
      .getAllByRole('option')
      .map((option) => option.textContent)
  ).toEqual(CYCLES)
})

test('el ciclo de cuartas desde Fa', async () => {
  const app = renderApp()
  await pickMode(app, 'Progresión')
  await pickProgression(app, 'Ciclo de cuartas')
  await pickTonic(app, 'Fa')
  await play(app)
  app.fake.beat(5)

  const lane = bars().map((bar) => bar.textContent)
  expect(lane).toHaveLength(24)
  expect(lane.slice(0, 4)).toEqual(['F', 'F', 'B♭', 'B♭'])
  expect(lane.slice(-2)).toEqual(['C', 'C'])
  expect(nowRegion().getByText('F')).toBeDefined()
  expect(nowRegion().getByText('Fa')).toBeDefined()
  expect(
    screen.getByText(
      'Ciclo de cuartas · desde Fa · Analógico cálido · 60 BPM · 4/4'
    )
  ).toBeDefined()
})

test('en los ciclos de solo raíces, el tipo de acorde lo elige el usuario', async () => {
  const app = renderApp()
  await pickMode(app, 'Progresión')
  await pickProgression(app, 'Ciclo de cuartas')
  await pickTonic(app, 'Fa')
  await pickSound(app, 'Bajo + acorde')
  const panel = await app.openSettings()
  expect(panel.getByRole('combobox', { name: 'Tipo de acorde' })).toBeDefined()
  await app.closeSettings()

  await pickChordType(app, 'Cm7 · menor séptima')
  await play(app)
  app.fake.beat(4 + 2 * 4 + 1)

  expect(nowRegion().getByText('B♭m7')).toBeDefined()
  const first = voicingOf('F', 'm7')
  const second = chordPitches(app.fake, 2)
  expect(chordPitches(app.fake, 1)).toEqual(first)
  expect(chordPitches(app.fake, 3)).toEqual(voicingOf('Bb', 'm7', second))
})

test('en las demás progresiones no aparece el tipo de acorde', async () => {
  const app = renderApp()
  await pickMode(app, 'Progresión')
  await pickSound(app, 'Bajo + acorde')
  await pickProgression(app, 'Blues de jazz')
  let panel = await app.openSettings()
  expect(panel.queryByRole('combobox', { name: 'Tipo de acorde' })).toBeNull()
  await app.closeSettings()

  await pickProgression(app, 'Ciclo de quintas')
  panel = await app.openSettings()
  expect(panel.getByRole('combobox', { name: 'Tipo de acorde' })).toBeDefined()
})

test('el ii–V–I por las 12 recorre 48 compases por cuartas', async () => {
  const app = renderApp()
  await pickMode(app, 'Progresión')
  await pickProgression(app, 'ii–V–I por las 12 tonalidades')
  await play(app)
  app.fake.beat(4 + 4 * 4 + 1)

  expect(bars()).toHaveLength(48)
  expect(screen.getByText('Vuelta 1 · compás 5 de 48')).toBeDefined()
  expect(nowRegion().getByText('Gm7')).toBeDefined()
  expect(
    screen.getByText(
      'ii–V–I por las 12 tonalidades · desde Do · Analógico cálido · 60 BPM · 4/4'
    )
  ).toBeDefined()
})
