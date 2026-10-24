import { screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { renderApp } from '@/test/app'

type App = ReturnType<typeof renderApp>

const SWITCH = { name: 'Parar tras N vueltas' }

// una vuelta dura 12 compases: una nota por compás
async function setRepeats(app: App, repeats: number | 'off') {
  const panel = await app.openSettings()
  const toggle = panel.getByRole('switch', SWITCH)
  const on = toggle.getAttribute('aria-checked') === 'true'
  if (repeats === 'off') {
    if (on) await app.user.click(toggle)
  } else {
    if (!on) await app.user.click(toggle)
    await app.typeNumber(
      panel.getByRole('spinbutton', { name: 'Vueltas' }),
      String(repeats)
    )
  }
  await app.closeSettings()
}

async function play(repeats: number | 'off') {
  const app = renderApp()
  const panel = await app.openSettings()
  await app.typeNumber(
    panel.getByRole('spinbutton', { name: 'Compases por nota' }),
    '1'
  )
  await app.closeSettings()
  await setRepeats(app, repeats)
  await app.user.click(screen.getByRole('button', { name: 'Play' }))
  return app
}

test('por defecto la práctica sigue hasta Stop', async () => {
  const { openSettings } = renderApp()
  const panel = await openSettings()

  expect(panel.getByRole('switch', SWITCH).getAttribute('aria-checked')).toBe(
    'false'
  )
  expect(panel.queryByRole('spinbutton', { name: 'Vueltas' })).toBeNull()
})

test('con N vueltas, el contador muestra el total', async () => {
  const { fake } = await play(2)

  fake.beat(4 + 1)
  expect(screen.getByText('Vuelta 1 de 2 · nota 1 de 12')).toBeDefined()
  fake.beat(12 * 4)
  expect(screen.getByText('Vuelta 2 de 2 · nota 1 de 12')).toBeDefined()
})

test('la última vuelta no muestra la siguiente, y al terminar vuelve a Play', async () => {
  const { fake } = await play(2)

  // la última nota de la vuelta 2
  fake.beat(4 + 12 * 4 + 11 * 4 + 1)
  expect(screen.getByText('Vuelta 2 de 2 · nota 12 de 12')).toBeDefined()
  expect(screen.queryByText(/^Vuelta 3: /)).toBeNull()

  fake.beat(4)
  expect(fake.running).toBe(false)
  expect(screen.getByRole('button', { name: 'Play' })).toBeDefined()
  expect(screen.getByText('Toca Play para empezar.')).toBeDefined()
})

test('bajar N mientras suena termina la vuelta en curso', async () => {
  const app = await play(3)
  // vuelta 2
  app.fake.beat(4 + 12 * 4 + 1)
  expect(screen.getByText('Vuelta 2 de 3 · nota 1 de 12')).toBeDefined()

  await setRepeats(app, 1)
  app.fake.beat(12 * 4)

  expect(app.fake.running).toBe(false)
})

test('subir N en la última nota descarta el fin', async () => {
  const app = await play(1)
  // la última nota de la vuelta 1
  app.fake.beat(4 + 11 * 4 + 1)
  expect(screen.getByText('Vuelta 1 de 1 · nota 12 de 12')).toBeDefined()

  await setRepeats(app, 2)
  app.fake.beat(4)

  expect(app.fake.running).toBe(true)
  expect(screen.getByText('Vuelta 2 de 2 · nota 1 de 12')).toBeDefined()
})

test('apagarlo mientras suena sigue hasta Stop', async () => {
  const app = await play(1)
  app.fake.beat(5)

  await setRepeats(app, 'off')
  app.fake.beat(12 * 4)

  expect(app.fake.running).toBe(true)
  expect(screen.getByText('Vuelta 2 · nota 1 de 12')).toBeDefined()
})

test('bajar N descarta la vista previa de la vuelta siguiente', async () => {
  const app = await play(3)
  app.fake.beat(4 + 11 * 4 + 1)
  expect(screen.getByText(/^Vuelta 2: /)).toBeDefined()

  await setRepeats(app, 1)

  expect(screen.queryByText(/^Vuelta 2: /)).toBeNull()
})
