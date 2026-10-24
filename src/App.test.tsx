import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test } from 'vitest'
import { createFakeEngine } from '@/test/fake-engine'
import App from './App'

function setup() {
  const fake = createFakeEngine()
  const user = userEvent.setup()
  render(<App engine={fake.engine} />)
  return { fake, user }
}

function clicks(fake: ReturnType<typeof createFakeEngine>) {
  return fake.played.flatMap(({ bar, beat, sound }) =>
    sound.kind === 'click' ? [{ bar, beat, accent: sound.accent }] : []
  )
}

test('tiene el título de la app para lectores de pantalla', () => {
  setup()
  screen.getByRole('heading', { level: 1, name: 'Countdown Notes' })
})

test('Play arranca el metrónomo en 4/4 a 60 BPM con la cuenta de entrada', async () => {
  const { fake, user } = setup()
  await user.click(screen.getByRole('button', { name: 'Play' }))
  expect(fake.running).toBe(true)
  expect(fake.bpm).toBe(60)

  fake.beat(8)
  expect(clicks(fake)).toEqual(
    [0, 1].flatMap((bar) => [
      { bar, beat: 0, accent: true },
      { bar, beat: 1, accent: false },
      { bar, beat: 2, accent: false },
      { bar, beat: 3, accent: false }
    ])
  )
})

test('Stop detiene el motor y vuelve a ofrecer Play', async () => {
  const { fake, user } = setup()
  await user.click(screen.getByRole('button', { name: 'Play' }))
  fake.beat(2)
  await user.click(screen.getByRole('button', { name: 'Stop' }))
  expect(fake.running).toBe(false)
  screen.getByRole('button', { name: 'Play' })
})

test('Play después de Stop empieza de nuevo con la cuenta de entrada', async () => {
  const { fake, user } = setup()
  await user.click(screen.getByRole('button', { name: 'Play' }))
  fake.beat(6)
  await user.click(screen.getByRole('button', { name: 'Stop' }))
  await user.click(screen.getByRole('button', { name: 'Play' }))
  fake.beat(1)
  expect(fake.played.at(-1)).toEqual({
    bar: 0,
    beat: 0,
    sound: { kind: 'click', accent: true }
  })
})
