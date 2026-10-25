import { screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { renderApp, type FakeEngine } from '@/test/app'

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
const pickTonic = (app: App, name: string) => pick(app, 'Tonalidad', name)

function bassByBar(fake: FakeEngine) {
  return new Map(
    fake.played.flatMap(({ bar, sound }) =>
      sound.kind === 'bass' ? [[bar, sound.pitch] as const] : []
    )
  )
}

const bars = () =>
  within(screen.getByRole('list', { name: 'Carril' })).getAllByRole('listitem')

const nowRegion = () => within(screen.getByRole('region', { name: 'Ahora' }))

async function play(app: App) {
  await app.user.click(screen.getByRole('button', { name: 'Play' }))
}

test('hay 12 tónicas, con Do por defecto', async () => {
  const app = renderApp()
  await pickMode(app, 'Progresión')
  const panel = await app.openSettings()
  const tonic = within(panel.getByRole('radiogroup', { name: 'Tonalidad' }))

  expect(
    tonic
      .getAllByRole('radio')
      .map((radio) => [
        radio.getAttribute('aria-label'),
        radio.textContent,
        radio.getAttribute('aria-checked')
      ])
  ).toEqual([
    ['Do', 'C', 'true'],
    ['Re bemol', 'D♭', 'false'],
    ['Re', 'D', 'false'],
    ['Mi bemol', 'E♭', 'false'],
    ['Mi', 'E', 'false'],
    ['Fa', 'F', 'false'],
    ['Fa sostenido', 'F♯', 'false'],
    ['Sol', 'G', 'false'],
    ['La bemol', 'A♭', 'false'],
    ['La', 'A', 'false'],
    ['Si bemol', 'B♭', 'false'],
    ['Si', 'B', 'false']
  ])
})

test('en Fa suena y se ve el ii–V–I de Fa', async () => {
  const app = renderApp()
  await pickMode(app, 'Progresión')
  await pickTonic(app, 'Fa')
  await play(app)
  app.fake.beat(4 + 4 * 4)

  expect(bars().map((bar) => bar.textContent)).toEqual([
    'Gm7',
    'C7',
    'Fmaj7',
    'Fmaj7'
  ])
  const bass = bassByBar(app.fake)
  expect(Array.from({ length: 4 }, (_, k) => bass.get(1 + k))).toEqual([
    'G2',
    'C2',
    'F2',
    'F2'
  ])
})

test('en Si, cada acorde con las alteraciones de Si mayor', async () => {
  const app = renderApp()
  await pickMode(app, 'Progresión')
  await pickTonic(app, 'Si')
  await play(app)
  app.fake.beat(5)

  expect(nowRegion().getByText('C♯m7')).toBeDefined()
  expect(nowRegion().getByText('Do sostenido menor séptima')).toBeDefined()
  expect(
    screen.getByText(
      'ii–V–I mayor · Si mayor · Analógico cálido · 60 BPM · 4/4'
    )
  ).toBeDefined()
})

test('un cambio de tonalidad aplica desde la vuelta siguiente', async () => {
  const app = renderApp()
  await pickMode(app, 'Progresión')
  await play(app)

  // compás 2
  app.fake.beat(4 + 4 + 1)
  await pickTonic(app, 'Fa')

  // compás 4: la vuelta 2 ya está armada, pero la 1 sigue en Do
  app.fake.beat(8)
  const bass = bassByBar(app.fake)
  expect([bass.get(3), bass.get(4)]).toEqual(['C2', 'C2'])
  expect(bars().map((bar) => bar.textContent)).toEqual([
    'Dm7',
    'G7',
    'Cmaj7',
    'Cmaj7'
  ])
  expect(screen.getByText('Vuelta 2: Gm7')).toBeDefined()

  // compás 5: empieza la vuelta 2
  app.fake.beat(4)
  expect(bassByBar(app.fake).get(5)).toBe('G2')
  expect(bars()[0].textContent).toBe('Gm7')
  expect(screen.getByText(/ · Fa mayor · /)).toBeDefined()
})

test('un cambio durante el último compás aplica una vuelta después', async () => {
  const app = renderApp()
  await pickMode(app, 'Progresión')
  await play(app)

  // compás 4: la vuelta 2 ya está armada, en Do
  app.fake.beat(4 + 3 * 4 + 1)
  await pickTonic(app, 'Fa')

  app.fake.beat(4 * 5)
  const bass = bassByBar(app.fake)
  expect(bass.get(5)).toBe('D2')
  expect(bass.get(9)).toBe('G2')
})

test('con la música detenida, aplica al siguiente Play', async () => {
  const app = renderApp()
  await pickMode(app, 'Progresión')
  await pickTonic(app, 'Fa')
  await play(app)
  app.fake.beat(5)

  expect(bassByBar(app.fake).get(1)).toBe('G2')
})

test('la tónica se recuerda', async () => {
  const first = renderApp()
  await pickMode(first, 'Progresión')
  await pickTonic(first, 'Fa')
  first.unmount()

  const again = renderApp()
  const panel = await again.openSettings()
  expect(
    panel.getByRole('radio', { name: 'Fa' }).getAttribute('aria-checked')
  ).toBe('true')
})
