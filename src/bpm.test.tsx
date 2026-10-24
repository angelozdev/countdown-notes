import { screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { renderApp } from '@/test/app'

test('la pantalla de práctica muestra el tempo arriba y no tiene controles de ajuste', () => {
  renderApp()
  screen.getByText('Aleatorio · Analógico cálido · 60 BPM · 4/4')
  expect(screen.queryAllByRole('spinbutton')).toHaveLength(0)
  expect(screen.queryAllByRole('slider')).toHaveLength(0)
  expect(screen.queryAllByRole('textbox')).toHaveLength(0)
  screen.getByRole('button', { name: 'Ajustes' })
})

test('el BPM empieza en 60 y se limita a 30–240', async () => {
  const { openSettings, typeNumber } = renderApp()
  const panel = await openSettings()
  const bpm = panel.getByRole('spinbutton', { name: 'BPM' })
  expect(bpm).toHaveProperty('value', '60')

  await typeNumber(bpm, '300')
  expect(bpm).toHaveProperty('value', '240')
  await typeNumber(bpm, '10')
  expect(bpm).toHaveProperty('value', '30')
  await typeNumber(bpm, '')
  expect(bpm).toHaveProperty('value', '30')
})

test('− y + cambian el BPM de a uno', async () => {
  const { user, openSettings } = renderApp()
  const panel = await openSettings()
  await user.click(panel.getByRole('button', { name: 'Subir BPM' }))
  expect(panel.getByRole('spinbutton', { name: 'BPM' })).toHaveProperty(
    'value',
    '61'
  )
  await user.click(panel.getByRole('button', { name: 'Bajar BPM' }))
  await user.click(panel.getByRole('button', { name: 'Bajar BPM' }))
  expect(panel.getByRole('spinbutton', { name: 'BPM' })).toHaveProperty(
    'value',
    '59'
  )
})

test('Play usa el BPM elegido', async () => {
  const { fake, user, openSettings, closeSettings, typeNumber } = renderApp()
  const panel = await openSettings()
  await typeNumber(panel.getByRole('spinbutton', { name: 'BPM' }), '90')
  await closeSettings()
  await user.click(screen.getByRole('button', { name: 'Play' }))
  expect(fake.bpm).toBe(90)
})

test('con la música sonando, el BPM cambia de inmediato sin detenerla', async () => {
  const { fake, user, openSettings, closeSettings, typeNumber } = renderApp()
  await user.click(screen.getByRole('button', { name: 'Play' }))
  fake.beat(2)

  const panel = await openSettings()
  await typeNumber(panel.getByRole('spinbutton', { name: 'BPM' }), '120')
  expect(fake.bpm).toBe(120)
  expect(fake.running).toBe(true)

  await closeSettings()
  expect(fake.running).toBe(true)
  screen.getByText('Aleatorio · Analógico cálido · 120 BPM · 4/4')
})
