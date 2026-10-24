import { screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { renderApp } from '@/test/app'

async function play(app: ReturnType<typeof renderApp>) {
  await app.user.click(screen.getByRole('button', { name: 'Play' }))
}

test('los dos canales empiezan en 80 y sin silenciar', async () => {
  const app = renderApp()
  const panel = await app.openSettings()

  for (const name of ['Volumen del bajo', 'Volumen del metrónomo']) {
    expect(
      panel.getByRole('slider', { name }).getAttribute('aria-valuenow')
    ).toBe('80')
  }
  for (const name of ['Silenciar bajo', 'Silenciar metrónomo']) {
    expect(
      panel.getByRole('button', { name }).getAttribute('aria-pressed')
    ).toBe('false')
  }
})

test('Play arranca con la mezcla del panel', async () => {
  const app = renderApp()
  await play(app)

  expect(app.fake.mix).toEqual({
    click: { volume: 80, muted: false },
    bass: { volume: 80, muted: false },
    chord: { volume: 80, muted: false }
  })
})

test('el volumen cambia de inmediato sin detener la música', async () => {
  const app = renderApp()
  await play(app)
  app.fake.beat(5)
  const panel = await app.openSettings()
  panel.getByRole('slider', { name: 'Volumen del bajo' }).focus()
  await app.user.keyboard('{ArrowLeft}')

  expect(app.fake.mix?.bass.volume).toBe(79)
  expect(app.fake.running).toBe(true)
})

test('silenciar un canal no detiene la práctica, y quitar el silencio devuelve el volumen', async () => {
  const app = renderApp()
  await play(app)
  app.fake.beat(5)
  const panel = await app.openSettings()
  await app.user.click(
    panel.getByRole('button', { name: 'Silenciar metrónomo' })
  )

  expect(app.fake.mix?.click).toEqual({ volume: 80, muted: true })
  expect(app.fake.running).toBe(true)

  await app.closeSettings()
  app.fake.beat(8)
  expect(screen.getByText('Vuelta 1 · nota 2 de 12')).toBeDefined()

  const again = await app.openSettings()
  await app.user.click(
    again.getByRole('button', { name: 'Silenciar metrónomo' })
  )
  expect(app.fake.mix?.click).toEqual({ volume: 80, muted: false })
})

test('la cuenta de entrada va marcada para sonar aunque el metrónomo esté silenciado', async () => {
  const app = renderApp()
  const panel = await app.openSettings()
  await app.user.click(
    panel.getByRole('button', { name: 'Silenciar metrónomo' })
  )
  await app.closeSettings()
  await play(app)
  app.fake.beat(5)

  expect(app.fake.bars[0].countIn).toBe(true)
  expect(app.fake.bars[1].countIn).not.toBe(true)
})
