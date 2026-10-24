import { screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { renderApp } from '@/test/app'

const WARM = 'Aleatorio · Analógico cálido · 60 BPM · 4/4'
const PAD = 'Aleatorio · Pad ambiental · 60 BPM · 4/4'

type App = ReturnType<typeof renderApp>

const styleGroup = (panel: Awaited<ReturnType<App['openSettings']>>) =>
  within(panel.getByRole('radiogroup', { name: 'Estilo' }))

async function pickStyle(app: App, name: string) {
  const panel = await app.openSettings()
  await app.user.click(styleGroup(panel).getByRole('radio', { name }))
  await app.closeSettings()
}

test('empieza en Analógico cálido', async () => {
  const app = renderApp()
  const panel = await app.openSettings()

  expect(
    styleGroup(panel)
      .getAllByRole('radio')
      .map((radio) => [radio.textContent, radio.getAttribute('aria-checked')])
  ).toEqual([
    ['Analógico cálido', 'true'],
    ['Pad ambiental', 'false']
  ])
  await app.closeSettings()
  screen.getByText(WARM)
})

test('con la música detenida, la línea de estado muestra el estilo elegido', async () => {
  const app = renderApp()
  await pickStyle(app, 'Pad ambiental')

  screen.getByText(PAD)
})

test('un cambio de estilo a mitad de compás aplica desde el compás siguiente', async () => {
  const app = renderApp()
  await app.user.click(screen.getByRole('button', { name: 'Play' }))
  app.fake.beat(4 + 2)
  expect(app.fake.bars[1].style).toBe('warm')

  await pickStyle(app, 'Pad ambiental')
  screen.getByText(WARM)

  app.fake.beat(2 + 1)
  expect(app.fake.bars[2].style).toBe('pad')
  screen.getByText(PAD)
})

test('el estilo se recuerda', async () => {
  const first = renderApp()
  await pickStyle(first, 'Pad ambiental')
  first.unmount()

  const panel = await renderApp().openSettings()
  expect(
    styleGroup(panel)
      .getByRole('radio', { name: 'Pad ambiental' })
      .getAttribute('aria-checked')
  ).toBe('true')
})
