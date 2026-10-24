import { screen, waitFor } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import { renderApp } from '@/test/app'

// jsdom no tiene Wake Lock: el borde con el navegador es falso, como el motor
function fakeWakeLock() {
  type Sentinel = { released: boolean; release: () => Promise<void> }
  const sentinels: Sentinel[] = []
  const request = vi.fn<(type: 'screen') => Promise<Sentinel>>(async () => {
    const sentinel = {
      released: false,
      release: vi.fn<() => Promise<void>>(async () => {
        sentinel.released = true
      })
    }
    sentinels.push(sentinel)
    return sentinel
  })
  Object.defineProperty(navigator, 'wakeLock', {
    value: { request },
    configurable: true
  })
  return { request, sentinels }
}

afterEach(() => {
  Reflect.deleteProperty(navigator, 'wakeLock')
  Reflect.deleteProperty(document, 'visibilityState')
})

test('Play mantiene la pantalla encendida y Stop la libera', async () => {
  const { request, sentinels } = fakeWakeLock()
  const { user } = renderApp()

  await user.click(screen.getByRole('button', { name: 'Play' }))
  await waitFor(() => expect(request).toHaveBeenCalledWith('screen'))

  await user.click(screen.getByRole('button', { name: 'Stop' }))
  await waitFor(() => expect(sentinels[0].release).toHaveBeenCalled())
})

test('al volver a la pestaña la pide de nuevo si sigue sonando', async () => {
  const { request, sentinels } = fakeWakeLock()
  const { user } = renderApp()

  await user.click(screen.getByRole('button', { name: 'Play' }))
  await waitFor(() => expect(request).toHaveBeenCalledTimes(1))

  // el sistema la liberó al cambiar de pestaña
  sentinels[0].released = true
  Object.defineProperty(document, 'visibilityState', {
    value: 'visible',
    configurable: true
  })
  document.dispatchEvent(new Event('visibilitychange'))

  await waitFor(() => expect(request).toHaveBeenCalledTimes(2))
})

test('sin Wake Lock, Play funciona igual', async () => {
  const { fake, user } = renderApp()

  await user.click(screen.getByRole('button', { name: 'Play' }))
  expect(fake.running).toBe(true)
})

test('la barra espaciadora hace Play y Stop', async () => {
  const { fake, user } = renderApp()

  await user.keyboard(' ')
  expect(fake.running).toBe(true)
  await user.keyboard(' ')
  expect(fake.running).toBe(false)
})

test('con el foco en Play, alterna una sola vez por pulsación', async () => {
  const { fake, user } = renderApp()
  screen.getByRole('button', { name: 'Play' }).focus()

  await user.keyboard(' ')
  screen.getByRole('button', { name: 'Stop' })
  expect(fake.running).toBe(true)

  await user.keyboard(' ')
  screen.getByRole('button', { name: 'Play' })
  expect(fake.running).toBe(false)
})

test('con el foco en Ajustes, alterna y no abre el panel', async () => {
  const { fake, user } = renderApp()
  screen.getByRole('button', { name: 'Ajustes' }).focus()

  await user.keyboard(' ')
  expect(fake.running).toBe(true)
  expect(screen.queryByRole('dialog')).toBeNull()
})

test('con el panel abierto, no hace Play', async () => {
  const { fake, user, openSettings } = renderApp()
  await openSettings()

  await user.keyboard(' ')
  expect(fake.running).toBe(false)
})

test('con menos de 2 notas, no hace nada', async () => {
  const { fake, user, openSettings, closeSettings } = renderApp()
  const panel = await openSettings()
  await user.click(panel.getByRole('button', { name: 'Excluir naturales' }))
  await user.click(panel.getByRole('button', { name: 'Excluir alteradas' }))
  await user.click(panel.getByRole('button', { name: 'C' }))
  await closeSettings()

  await user.keyboard(' ')
  expect(fake.running).toBe(false)
})

test('el tempo rápido sube y baja de a 5 sin abrir ajustes', async () => {
  const { fake, user } = renderApp()
  await user.click(screen.getByRole('button', { name: 'Play' }))

  await user.click(screen.getByRole('button', { name: 'Subir 5 BPM' }))
  expect(fake.bpm).toBe(65)
  screen.getByText('Aleatorio · Analógico cálido · 65 BPM · 4/4')

  await user.click(screen.getByRole('button', { name: 'Bajar 5 BPM' }))
  await user.click(screen.getByRole('button', { name: 'Bajar 5 BPM' }))
  expect(fake.bpm).toBe(55)
})

test('el tempo rápido se limita a 30–240', async () => {
  const { user, openSettings, closeSettings, typeNumber } = renderApp()
  async function setBpm(value: string) {
    const panel = await openSettings()
    await typeNumber(panel.getByRole('spinbutton', { name: 'BPM' }), value)
    await closeSettings()
  }

  await setBpm('238')
  await user.click(screen.getByRole('button', { name: 'Subir 5 BPM' }))
  screen.getByText('Aleatorio · Analógico cálido · 240 BPM · 4/4')

  await setBpm('32')
  await user.click(screen.getByRole('button', { name: 'Bajar 5 BPM' }))
  screen.getByText('Aleatorio · Analógico cálido · 30 BPM · 4/4')
})
