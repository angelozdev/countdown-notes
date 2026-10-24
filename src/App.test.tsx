import { render, screen } from '@testing-library/react'
import { test } from 'vitest'
import App from './App'

test('muestra la pantalla base en español', () => {
  render(<App />)
  screen.getByRole('heading', { level: 1, name: 'Countdown Notes' })
  screen.getByText('Acompañamiento para improvisar con la guitarra.')
})
