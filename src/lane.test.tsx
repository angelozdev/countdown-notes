import { screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { renderApp } from '@/test/app'

const ahora = () => screen.getByRole('region', { name: 'Ahora' })
const carril = () => screen.getByRole('list', { name: 'Carril' })
const bars = () => within(carril()).getAllByRole('listitem')
const current = () =>
  bars().filter((bar) => bar.getAttribute('aria-current') === 'true')

async function play() {
  const app = renderApp()
  await app.user.click(screen.getByRole('button', { name: 'Play' }))
  return app
}

test('detenida, "Ahora" invita a tocar y no hay carril', () => {
  renderApp()
  expect(within(ahora()).getByText('Toca Play para empezar.')).toBeDefined()
  expect(screen.queryByRole('list', { name: 'Carril' })).toBeNull()
})

test('durante la cuenta de entrada, "Ahora" muestra 4, 3, 2, 1', async () => {
  const { fake } = await play()
  for (const count of ['4', '3', '2', '1']) {
    fake.beat(1)
    expect(within(ahora()).getByText(count)).toBeDefined()
  }
  fake.beat(1)
  expect(within(ahora()).queryByText(/^[1-4]$/)).toBeNull()
})

test('el carril muestra la vuelta completa, cada compás con su nota', async () => {
  const { fake } = await play()
  fake.beat(1)

  const labels = bars().map((bar) => bar.textContent)
  expect(labels).toHaveLength(24)
  for (let k = 0; k < 24; k += 2) expect(labels[k + 1]).toBe(labels[k])
  expect(new Set(labels).size).toBe(12)
})

test('el compás actual se marca y avanza con la música', async () => {
  const { fake } = await play()
  fake.beat(4)
  expect(current()).toHaveLength(0)

  fake.beat(1)
  expect(current()).toEqual([bars()[0]])
  fake.beat(4)
  expect(current()).toEqual([bars()[1]])
})

test('el contador muestra la vuelta y la nota', async () => {
  const { fake } = await play()
  fake.beat(5)
  expect(screen.getByText('Vuelta 1 · nota 1 de 12')).toBeDefined()
  fake.beat(8)
  expect(screen.getByText('Vuelta 1 · nota 2 de 12')).toBeDefined()
})

test('desde la última nota de la vuelta se ve la primera de la siguiente', async () => {
  const { fake } = await play()
  fake.beat(4 + 22 * 4)
  expect(screen.queryByText(/^Vuelta 2: /)).toBeNull()

  // compás 23: empieza la última nota de la vuelta 1
  fake.beat(1)
  const preview = screen.getByText(/^Vuelta 2: /).textContent!
  const next = preview.replace('Vuelta 2: ', '')
  expect(next).not.toBe(bars()[23].textContent)

  // compás 25: empieza la vuelta 2
  fake.beat(2 * 4)
  expect(screen.getByText('Vuelta 2 · nota 1 de 12')).toBeDefined()
  expect(bars()[0].textContent).toBe(next)
})
