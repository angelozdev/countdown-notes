import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '@/App'
import { createFakeEngine } from './fake-engine'

export type FakeEngine = ReturnType<typeof createFakeEngine>

/** Monta la app completa con el motor falso. */
export function renderApp() {
  const fake = createFakeEngine()
  const user = userEvent.setup()
  render(<App engine={fake.engine} />)

  async function openSettings() {
    await user.click(screen.getByRole('button', { name: 'Ajustes' }))
    return within(screen.getByRole('dialog', { name: 'Ajustes' }))
  }

  async function closeSettings() {
    await user.click(screen.getByRole('button', { name: 'Cerrar' }))
  }

  /** Escribe un valor en un campo numérico del panel y lo confirma con Enter. */
  async function typeNumber(field: HTMLElement, value: string) {
    await user.clear(field)
    await user.type(field, `${value}{Enter}`)
  }

  return { fake, user, openSettings, closeSettings, typeNumber }
}
