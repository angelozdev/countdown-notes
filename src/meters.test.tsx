import { screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { renderApp, type FakeEngine } from '@/test/app'

type App = ReturnType<typeof renderApp>

const statusLine = (meter: string) =>
  `Aleatorio · Analógico cálido · 60 BPM · ${meter}`
const ahora = () => screen.getByRole('region', { name: 'Ahora' })
const bars = () =>
  within(screen.getByRole('list', { name: 'Carril' })).getAllByRole('listitem')
const currentBar = () =>
  bars().find((bar) => bar.getAttribute('aria-current') === 'true')!

async function chooseMeter(app: App, id: string) {
  const panel = await app.openSettings()
  const group = panel.getByRole('radiogroup', { name: 'Compás' })
  await app.user.click(within(group).getByRole('radio', { name: id }))
  await app.closeSettings()
}

/** Los acentos de los clicks de ese compás, en orden. */
const clicksOf = (fake: FakeEngine, bar: number) =>
  fake.played.flatMap(({ bar: b, sound }) =>
    b === bar && sound.kind === 'click' ? [sound.accent] : []
  )

async function playIn(id: string) {
  const app = renderApp()
  await chooseMeter(app, id)
  await app.user.click(screen.getByRole('button', { name: 'Play' }))
  return app
}

test('el compás empieza en 4/4 y se elige entre los 8', async () => {
  const app = renderApp()
  const panel = await app.openSettings()
  const radios = within(
    panel.getByRole('radiogroup', { name: 'Compás' })
  ).getAllByRole('radio')

  expect(radios.map((radio) => radio.textContent)).toEqual([
    '2/4',
    '3/4',
    '4/4',
    '5/4',
    '6/8',
    '7/8',
    '9/8',
    '12/8'
  ])
  expect(
    radios.filter((radio) => radio.getAttribute('aria-checked') === 'true')
  ).toEqual([panel.getByRole('radio', { name: '4/4' })])
})

test('en 6/8 marca cada corchea, con acento fuerte en la 1 y suave en la 4', async () => {
  const { fake } = await playIn('6/8')
  fake.beat(12)

  const accents = ['strong', 'none', 'none', 'soft', 'none', 'none']
  expect(clicksOf(fake, 0)).toEqual(accents)
  expect(clicksOf(fake, 1)).toEqual(accents)
  screen.getByText(statusLine('6/8'))
})

test('en 6/8 la cuenta y las marcas van por grupo', async () => {
  const { fake } = await playIn('6/8')
  fake.beat(1)
  expect(within(ahora()).getByText('2')).toBeDefined()
  fake.beat(3)
  expect(within(ahora()).getByText('1')).toBeDefined()

  fake.beat(3)
  const current = currentBar()
  expect(
    within(current).getByRole('img', { name: 'Tiempo 1 de 2' })
  ).toBeDefined()
  for (const bar of bars().filter((bar) => bar !== current)) {
    expect(within(bar).getByRole('img', { name: '2 tiempos' })).toBeDefined()
  }

  fake.beat(3)
  expect(
    within(currentBar()).getByRole('img', { name: 'Tiempo 2 de 2' })
  ).toBeDefined()
})

test('en 7/8 agrupa 2+2+3', async () => {
  const { fake } = await playIn('7/8')
  fake.beat(1)
  expect(within(ahora()).getByText('3')).toBeDefined()
  fake.beat(2)
  expect(within(ahora()).getByText('2')).toBeDefined()
  fake.beat(2)
  expect(within(ahora()).getByText('1')).toBeDefined()
  fake.beat(2)

  expect(clicksOf(fake, 0)).toEqual([
    'strong',
    'none',
    'soft',
    'none',
    'soft',
    'none',
    'none'
  ])

  fake.beat(1)
  expect(
    within(currentBar()).getByRole('img', { name: 'Tiempo 1 de 3' })
  ).toBeDefined()
})

test('en 3/4 hay 3 golpes por compás y el bajo ataca en el 1', async () => {
  const { fake } = await playIn('3/4')
  fake.beat(3 + 3)

  expect(clicksOf(fake, 1)).toEqual(['strong', 'none', 'none'])
  const bass = fake.played.filter(
    ({ bar, sound }) => bar === 1 && sound.kind === 'bass'
  )
  expect(bass.map(({ beat }) => beat)).toEqual([0])
})

test('el compás cambiado mientras suena aplica desde la siguiente vuelta', async () => {
  const app = renderApp()
  await app.user.click(screen.getByRole('button', { name: 'Play' }))
  app.fake.beat(4 + 1)
  await chooseMeter(app, '3/4')
  screen.getByText(statusLine('4/4'))

  // la vuelta 1 dura 24 compases; se llega al tercer golpe del primer compás de la 2
  app.fake.beat(24 * 4 - 1 + 3)
  expect(clicksOf(app.fake, 24)).toHaveLength(4)
  expect(clicksOf(app.fake, 25)).toHaveLength(3)
  screen.getByText(statusLine('3/4'))
})
