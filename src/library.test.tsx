import { screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { renderApp, type FakeEngine } from '@/test/app'

type App = ReturnType<typeof renderApp>

const JAZZ = [
  'ii–V–I mayor',
  'ii–V–i menor',
  'I–vi–ii–V (turnaround)',
  'iii–vi–ii–V',
  'Ciclo diatónico (tipo Autumn Leaves)',
  'Sustituto tritonal',
  'ii–V "backdoor"',
  'Blues de jazz',
  'Blues menor',
  'Modal (tipo So What)',
  'Coltrane (Giant Steps, avanzado)'
]
const POP = [
  'I–V–vi–IV',
  'vi–IV–I–V',
  'I–vi–IV–V (doo-wop)',
  'I–IV–V',
  'Blues de rock',
  'Cadencia andaluza'
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
const pickMeter = (app: App, id: string) => pick(app, 'Compás', id)

async function pickProgression(app: App, name: string) {
  const panel = await app.openSettings()
  await app.user.selectOptions(
    panel.getByRole('combobox', { name: 'Progresión' }),
    name
  )
  await app.closeSettings()
}

function bassByBar(fake: FakeEngine) {
  return new Map(
    fake.played.flatMap(({ bar, sound }) =>
      sound.kind === 'bass' ? [[bar, sound.pitch] as const] : []
    )
  )
}

const soundsOf = (fake: FakeEngine, bar: number, kind: 'bass' | 'chord') =>
  fake.played.filter((event) => event.bar === bar && event.sound.kind === kind)

const bars = () =>
  within(screen.getByRole('list', { name: 'Carril' })).getAllByRole('listitem')

/** Las partes de un compás del carril: un `data-at` por acorde. */
const partsOf = (bar: HTMLElement) =>
  Array.from(bar.querySelectorAll('[data-at]'))

const nowRegion = () => within(screen.getByRole('region', { name: 'Ahora' }))

async function play(app: App) {
  await app.user.click(screen.getByRole('button', { name: 'Play' }))
}

test('el selector tiene la biblioteca por grupos', async () => {
  const app = renderApp()
  await pickMode(app, 'Progresión')
  const panel = await app.openSettings()
  const select = within(panel.getByRole('combobox', { name: 'Progresión' }))

  for (const [group, names] of [
    ['Jazz', JAZZ],
    ['Pop, rock y latino', POP]
  ] as const) {
    expect(
      within(select.getByRole('group', { name: group }))
        .getAllByRole('option')
        .map((option) => option.textContent)
    ).toEqual(names)
  }
  expect(select.getAllByRole('group')).toHaveLength(2)
  expect(select.getByRole('option', { selected: true }).textContent).toBe(
    'ii–V–I mayor'
  )
})

test('el blues de jazz parte los compases 11 y 12', async () => {
  const app = renderApp()
  await pickMode(app, 'Progresión')
  await pickProgression(app, 'Blues de jazz')
  await play(app)
  app.fake.beat(5)

  const lane = bars()
  expect(lane).toHaveLength(12)
  const shape = lane.map((bar) =>
    partsOf(bar).map((part) => [part.getAttribute('data-at'), part.textContent])
  )
  expect(shape.slice(0, 10).map((parts) => parts.map(([at]) => at))).toEqual(
    Array(10).fill(['0'])
  )
  expect(shape[10]).toEqual([
    ['0', 'C7'],
    ['2', 'A7']
  ])
  expect(shape[11]).toEqual([
    ['0', 'Dm7'],
    ['2', 'G7']
  ])
})

test('el bajo y el acorde atacan en el cambio de mitad de compás', async () => {
  const app = renderApp()
  await pickMode(app, 'Progresión')
  await pickProgression(app, 'Blues de jazz')
  await pickSound(app, 'Bajo + acorde')
  await play(app)
  app.fake.beat(4 + 11 * 4)

  expect(
    soundsOf(app.fake, 11, 'bass').map(({ beat, sound }) => [
      beat,
      sound.kind === 'bass' && [sound.pitch, sound.length]
    ])
  ).toEqual([
    [0, ['C2', 2]],
    [2, ['A2', 2]]
  ])
  expect(
    soundsOf(app.fake, 11, 'chord').map(({ beat, sound }) => [
      beat,
      sound.kind === 'chord' && sound.length
    ])
  ).toEqual([
    [0, 2],
    [2, 2]
  ])
})

test('"Ahora" cambia de acorde a mitad de compás', async () => {
  const app = renderApp()
  await pickMode(app, 'Progresión')
  await pickProgression(app, 'Blues de jazz')
  await play(app)

  // golpe 0 del compás 11
  app.fake.beat(4 + 10 * 4 + 1)
  expect(nowRegion().getByText('C7')).toBeDefined()

  app.fake.beat()
  expect(nowRegion().getByText('C7')).toBeDefined()

  app.fake.beat()
  expect(nowRegion().getByText('A7')).toBeDefined()
  expect(nowRegion().getByText('La séptima')).toBeDefined()
})

test('un acorde de varios compases vuelve a atacar en cada compás', async () => {
  const app = renderApp()
  await pickMode(app, 'Progresión')
  await pickProgression(app, 'Modal (tipo So What)')
  // la tónica del modal es la raíz de su acorde: en Re, Dm7 (spec, "Casos límite")
  await pickTonic(app, 'Re')
  await pickSound(app, 'Bajo + acorde')
  await play(app)
  app.fake.beat(4 + 8 * 4)

  const bass = bassByBar(app.fake)
  const first = soundsOf(app.fake, 1, 'chord')
  expect(first).toHaveLength(1)
  for (let bar = 1; bar <= 8; bar++) {
    const chords = soundsOf(app.fake, bar, 'chord')
    expect(chords.map(({ beat }) => beat)).toEqual([0])
    expect(chords[0].sound).toEqual(first[0].sound)
    expect(bass.get(bar)).toBe('D2')
  }
})

test('en 3/4, el compás se parte en 2 + 1', async () => {
  const app = renderApp()
  await pickMode(app, 'Progresión')
  await pickProgression(app, 'I–vi–ii–V (turnaround)')
  await pickMeter(app, '3/4')
  await pickSound(app, 'Bajo + acorde')
  await play(app)
  app.fake.beat(3 + 3)

  expect(
    soundsOf(app.fake, 1, 'chord').map(({ beat, sound }) => [
      beat,
      sound.kind === 'chord' && sound.length
    ])
  ).toEqual([
    [0, 2],
    [2, 1]
  ])
  expect(
    partsOf(bars()[0]).map((part) => part.getAttribute('data-at'))
  ).toEqual(['0', '2'])
})

test('la cadencia andaluza va en la tónica elegida, como menor', async () => {
  const app = renderApp()
  await pickMode(app, 'Progresión')
  await pickProgression(app, 'Cadencia andaluza')
  await pickTonic(app, 'La')
  await play(app)
  app.fake.beat(5)
  expect(bars().map((bar) => bar.textContent)).toEqual(['Am', 'G', 'F', 'E'])

  await app.user.click(screen.getByRole('button', { name: 'Stop' }))
  await pickTonic(app, 'Do')
  await play(app)
  app.fake.beat(5)
  expect(bars().map((bar) => bar.textContent)).toEqual(['Cm', 'B♭', 'A♭', 'G'])
  expect(screen.getByText(/^Cadencia andaluza · Do menor · /)).toBeDefined()

  const panel = await app.openSettings()
  expect(panel.getByRole('radio', { name: 'Do sostenido' }).textContent).toBe(
    'C♯'
  )
})

test('la tónica se comparte entre progresiones', async () => {
  const app = renderApp()
  await pickMode(app, 'Progresión')
  await pickTonic(app, 'Fa')
  await pickProgression(app, 'Blues de jazz')

  const panel = await app.openSettings()
  expect(
    panel.getByRole('radio', { name: 'Fa' }).getAttribute('aria-checked')
  ).toBe('true')
  await app.closeSettings()

  await play(app)
  app.fake.beat(5)
  expect(bars()[0].textContent).toBe('F7')
})

test('cambiar de progresión detiene la práctica', async () => {
  const app = renderApp()
  await pickMode(app, 'Progresión')
  await play(app)
  app.fake.beat(4 + 4 + 1)
  expect(app.fake.running).toBe(true)

  await pickProgression(app, 'Blues de jazz')
  expect(app.fake.running).toBe(false)
  expect(screen.getByRole('button', { name: 'Play' })).toBeDefined()

  await play(app)
  app.fake.beat(2)
  expect(app.fake.running).toBe(true)

  await pickProgression(app, 'ii–V–I mayor')
  expect(app.fake.running).toBe(false)
  expect(screen.getByRole('button', { name: 'Play' })).toBeDefined()
})

test('la progresión se recuerda', async () => {
  const first = renderApp()
  await pickMode(first, 'Progresión')
  await pickProgression(first, 'Blues de jazz')
  first.unmount()

  const again = renderApp()
  const panel = await again.openSettings()
  expect(
    within(panel.getByRole('combobox', { name: 'Progresión' })).getByRole(
      'option',
      { selected: true }
    ).textContent
  ).toBe('Blues de jazz')
})
