import { act, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { renderApp, type FakeEngine } from '@/test/app'

function clicks(fake: FakeEngine) {
  return fake.played.flatMap(({ bar, beat, sound }) =>
    sound.kind === 'click' ? [{ bar, beat, accent: sound.accent }] : []
  )
}

test('tiene el título de la app para lectores de pantalla', () => {
  renderApp()
  screen.getByRole('heading', { level: 1, name: 'Countdown Notes' })
})

test('Play arranca el metrónomo en 4/4 a 60 BPM con la cuenta de entrada', async () => {
  const { fake, user } = renderApp()
  await user.click(screen.getByRole('button', { name: 'Play' }))
  expect(fake.running).toBe(true)
  expect(fake.bpm).toBe(60)

  fake.beat(8)
  expect(clicks(fake)).toEqual(
    [0, 1].flatMap((bar) => [
      { bar, beat: 0, accent: 'strong' },
      { bar, beat: 1, accent: 'none' },
      { bar, beat: 2, accent: 'none' },
      { bar, beat: 3, accent: 'none' }
    ])
  )
})

test('Stop detiene el motor y vuelve a ofrecer Play', async () => {
  const { fake, user } = renderApp()
  await user.click(screen.getByRole('button', { name: 'Play' }))
  fake.beat(2)
  await user.click(screen.getByRole('button', { name: 'Stop' }))
  expect(fake.running).toBe(false)
  screen.getByRole('button', { name: 'Play' })
})

test('Play después de Stop empieza de nuevo con la cuenta de entrada', async () => {
  const { fake, user } = renderApp()
  await user.click(screen.getByRole('button', { name: 'Play' }))
  fake.beat(6)
  await user.click(screen.getByRole('button', { name: 'Stop' }))
  await user.click(screen.getByRole('button', { name: 'Play' }))
  fake.beat(1)
  expect(fake.played.at(-1)).toEqual({
    bar: 0,
    beat: 0,
    sound: { kind: 'click', accent: 'strong' }
  })
})

test('Stop mientras el audio se desbloquea no tumba la app cuando el motor pide el compás 0', async () => {
  const { fake, user } = renderApp()
  await user.click(screen.getByRole('button', { name: 'Play' }))
  // el motor real aún espera a Tone.start() y ya tiene en la mano el barAt y el onEnd del store
  const { barAt, onEnd } = fake.lastStart!
  await user.click(screen.getByRole('button', { name: 'Stop' }))

  // al terminar el desbloqueo pide el compás 0: ya no hay práctica, así que es el fin
  expect(barAt(0)).toBeUndefined()
  act(() => onEnd())
  screen.getByRole('button', { name: 'Play' })
})
