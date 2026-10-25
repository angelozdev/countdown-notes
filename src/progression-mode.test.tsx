import { screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { voicingOf } from '@/music/chords'
import { NOT_ENOUGH_NOTES } from '@/practice/store'
import { renderApp, type FakeEngine } from '@/test/app'

const KEY = 'countdown-notes:ajustes'

type App = ReturnType<typeof renderApp>

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
const pickSound = (app: App, name: string) => pick(app, 'Qué suena', name)

function bassByBar(fake: FakeEngine) {
  return new Map(
    fake.played.flatMap(({ bar, sound }) =>
      sound.kind === 'bass' ? [[bar, sound.pitch] as const] : []
    )
  )
}

const chordsOf = (fake: FakeEngine, bar: number) =>
  fake.played.filter(
    (event) => event.bar === bar && event.sound.kind === 'chord'
  )

const bars = () =>
  within(screen.getByRole('list', { name: 'Carril' })).getAllByRole('listitem')

const nowRegion = () => within(screen.getByRole('region', { name: 'Ahora' }))

async function play(app: App) {
  await app.user.click(screen.getByRole('button', { name: 'Play' }))
}

function saved(settings: unknown) {
  localStorage.setItem(KEY, JSON.stringify({ version: 1, settings }))
}

test('empieza en el modo aleatorio', async () => {
  const app = renderApp()
  const panel = await app.openSettings()
  const mode = within(panel.getByRole('radiogroup', { name: 'Modo' }))

  expect(
    mode
      .getAllByRole('radio')
      .map((radio) => [radio.textContent, radio.getAttribute('aria-checked')])
  ).toEqual([
    ['Aleatorio', 'true'],
    ['Progresión', 'false']
  ])
  expect(screen.getByText(/^Aleatorio · /)).toBeDefined()
})

test('en progresión, el panel no muestra lo del modo aleatorio', async () => {
  const app = renderApp()
  await pickMode(app, 'Progresión')
  const panel = await app.openSettings()

  expect(
    panel.queryByRole('spinbutton', { name: 'Compases por nota' })
  ).toBeNull()
  expect(panel.queryByRole('group', { name: 'Notas' })).toBeNull()
  await app.closeSettings()

  await pickSound(app, 'Bajo + acorde')
  expect(
    (await app.openSettings()).queryByRole('combobox', {
      name: 'Tipo de acorde'
    })
  ).toBeNull()
})

test('en progresión se puede tocar aunque haya una sola nota', () => {
  saved({ notes: ['C'], mode: 'progression' })
  renderApp()

  expect(screen.getByRole('button', { name: 'Play' })).toHaveProperty(
    'disabled',
    false
  )
  expect(screen.queryByText(NOT_ENOUGH_NOTES)).toBeNull()
})

test('suena el ii–V–I en Do, en loop', async () => {
  const app = renderApp()
  await pickMode(app, 'Progresión')
  await play(app)
  app.fake.beat(4 + 8 * 4)

  const bass = bassByBar(app.fake)
  expect(Array.from({ length: 8 }, (_, k) => bass.get(1 + k))).toEqual([
    'D2',
    'G2',
    'C2',
    'C2',
    'D2',
    'G2',
    'C2',
    'C2'
  ])
  expect(bass.has(0)).toBe(false)
})

test('el carril, Ahora, el contador y la línea de estado', async () => {
  const app = renderApp()
  await pickMode(app, 'Progresión')
  expect(
    screen.getByText(
      'ii–V–I mayor · Do mayor · Analógico cálido · 60 BPM · 4/4'
    )
  ).toBeDefined()

  await play(app)
  app.fake.beat(4 + 1)
  expect(bars().map((bar) => bar.textContent)).toEqual([
    'Dm7',
    'G7',
    'Cmaj7',
    'Cmaj7'
  ])
  expect(nowRegion().getByText('Dm7')).toBeDefined()
  expect(nowRegion().getByText('Re menor séptima')).toBeDefined()
  expect(screen.getByText('Vuelta 1 · compás 1 de 4')).toBeDefined()

  // el compás 7 es el 3.º de la vuelta 2
  app.fake.beat(4 * 6)
  expect(screen.getByText('Vuelta 2 · compás 3 de 4')).toBeDefined()
})

test('desde el último compás se anuncia la vuelta siguiente', async () => {
  const app = renderApp()
  await pickMode(app, 'Progresión')
  await play(app)

  app.fake.beat(4 + 2 * 4 + 1)
  expect(screen.queryByText(/^Vuelta 2: /)).toBeNull()

  app.fake.beat(4)
  expect(screen.getByText('Vuelta 2: Dm7')).toBeDefined()
})

test('con Bajo + acorde, cada acorde se liga al anterior', async () => {
  const app = renderApp()
  await pickMode(app, 'Progresión')
  await pickSound(app, 'Bajo + acorde')
  await play(app)
  app.fake.beat(4 + 5 * 4)

  const first = voicingOf('D', 'm7')
  const second = voicingOf('G', '7', first)
  const third = voicingOf('C', 'maj7', second)
  const expected = [first, second, third, third, first]
  for (const [k, pitches] of expected.entries()) {
    const chords = chordsOf(app.fake, 1 + k)
    expect(chords).toHaveLength(1)
    expect(chords[0].beat).toBe(0)
    expect(chords[0].sound).toEqual({ kind: 'chord', pitches, length: 4 })
  }
})

test('para tras 3 vueltas', async () => {
  const app = renderApp()
  await pickMode(app, 'Progresión')
  const panel = await app.openSettings()
  await app.user.click(
    panel.getByRole('switch', { name: 'Parar tras N vueltas' })
  )
  await app.typeNumber(panel.getByRole('spinbutton', { name: 'Vueltas' }), '3')
  await app.closeSettings()
  await play(app)

  app.fake.beat(4 + 8 * 4 + 1)
  expect(screen.getByText('Vuelta 3 de 3 · compás 1 de 4')).toBeDefined()

  // hasta pedir el compás 13, que ya no existe
  app.fake.beat(4 * 4)
  expect(app.fake.running).toBe(false)
  expect(bassByBar(app.fake).has(13)).toBe(false)
  expect(screen.getByRole('button', { name: 'Play' })).toBeDefined()
})

test('cambiar de modo detiene la práctica', async () => {
  const app = renderApp()
  await pickMode(app, 'Progresión')
  await play(app)
  app.fake.beat(4 + 4 + 1)
  expect(app.fake.running).toBe(true)

  await pickMode(app, 'Aleatorio')
  expect(app.fake.running).toBe(false)
  expect(screen.getByRole('button', { name: 'Play' })).toBeDefined()

  await pickMode(app, 'Progresión')
  await play(app)
  app.fake.beat(2)
  expect(app.fake.running).toBe(true)

  await pickMode(app, 'Aleatorio')
  expect(app.fake.running).toBe(false)
  expect(screen.getByRole('button', { name: 'Play' })).toBeDefined()
})

test('el modo se recuerda y lo de la entrega 3 se conserva', async () => {
  const first = renderApp()
  await pickMode(first, 'Progresión')
  first.unmount()

  const again = renderApp()
  const panel = await again.openSettings()
  expect(
    panel
      .getByRole('radio', { name: 'Progresión' })
      .getAttribute('aria-checked')
  ).toBe('true')
  again.unmount()

  saved({ withChord: true, chordType: 'm7', style: 'pad' })
  const old = renderApp()
  const oldPanel = await old.openSettings()
  expect(
    oldPanel
      .getByRole('radio', { name: 'Aleatorio' })
      .getAttribute('aria-checked')
  ).toBe('true')
  expect(
    oldPanel
      .getByRole('radio', { name: 'Bajo + acorde' })
      .getAttribute('aria-checked')
  ).toBe('true')
  expect(
    screen.getByText('Aleatorio · Pad ambiental · 60 BPM · 4/4')
  ).toBeDefined()
})
