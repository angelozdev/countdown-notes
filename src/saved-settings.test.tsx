import { screen, within } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { renderApp } from '@/test/app'

const KEY = 'countdown-notes:ajustes'

const LABELS = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B']
const NATURALS = ['C', 'D', 'E', 'F', 'G', 'A', 'B']

const DEFAULTS = {
  bpm: '60',
  barsPerNote: '2',
  notes: LABELS,
  meter: '4/4',
  figure: 'Redondas',
  octave: '2',
  bassVolume: '80',
  clickMuted: 'false',
  repeats: null
}

/** Lo que el panel de ajustes muestra ahora, ajuste por ajuste. */
async function readPanel(app: ReturnType<typeof renderApp>) {
  const panel = await app.openSettings()
  const picked = (group: string) =>
    within(panel.getByRole('radiogroup', { name: group }))
      .getAllByRole('radio')
      .find((radio) => radio.getAttribute('aria-checked') === 'true')
      ?.textContent
  const number = (name: string) =>
    (panel.queryByRole('spinbutton', { name }) as HTMLInputElement | null)
      ?.value ?? null
  return {
    bpm: number('BPM'),
    barsPerNote: number('Compases por nota'),
    notes: within(panel.getByRole('group', { name: 'Notas' }))
      .getAllByRole('button')
      .filter((note) => note.getAttribute('aria-pressed') === 'true')
      .map((note) => note.textContent),
    meter: picked('Compás'),
    figure: picked('Figura del bajo'),
    octave: picked('Octava del bajo'),
    bassVolume: panel
      .getByRole('slider', { name: 'Volumen del bajo' })
      .getAttribute('aria-valuenow'),
    clickMuted: panel
      .getByRole('button', { name: 'Silenciar metrónomo' })
      .getAttribute('aria-pressed'),
    repeats: number('Vueltas')
  }
}

function saved(settings: unknown, version = 1) {
  localStorage.setItem(KEY, JSON.stringify({ version, settings }))
}

test('los ajustes se recuerdan al volver a abrir la app', async () => {
  const first = renderApp()
  const panel = await first.openSettings()
  await first.typeNumber(panel.getByRole('spinbutton', { name: 'BPM' }), '90')
  await first.typeNumber(
    panel.getByRole('spinbutton', { name: 'Compases por nota' }),
    '3'
  )
  await first.user.click(
    panel.getByRole('button', { name: 'Excluir alteradas' })
  )
  for (const name of ['6/8', 'Negras', '3']) {
    await first.user.click(panel.getByRole('radio', { name }))
  }
  panel.getByRole('slider', { name: 'Volumen del bajo' }).focus()
  await first.user.keyboard('{ArrowLeft}')
  await first.user.click(
    panel.getByRole('button', { name: 'Silenciar metrónomo' })
  )
  await first.user.click(
    panel.getByRole('switch', { name: 'Parar tras N vueltas' })
  )
  await first.typeNumber(
    panel.getByRole('spinbutton', { name: 'Vueltas' }),
    '5'
  )
  first.unmount()

  expect(await readPanel(renderApp())).toEqual({
    bpm: '90',
    barsPerNote: '3',
    notes: NATURALS,
    meter: '6/8',
    figure: 'Negras',
    octave: '3',
    bassVolume: '79',
    clickMuted: 'true',
    repeats: '5'
  })
})

test('la app abre detenida aunque se haya cerrado sonando', async () => {
  const first = renderApp()
  await first.user.click(screen.getByRole('button', { name: 'Play' }))
  first.fake.beat(5)
  first.unmount()
  renderApp()

  screen.getByRole('button', { name: 'Play' })
  screen.getByText('Toca Play para empezar.')
})

test('con datos dañados abre con los valores por defecto', async () => {
  localStorage.setItem(KEY, '{roto')

  expect(await readPanel(renderApp())).toEqual(DEFAULTS)
})

test('un ajuste inválido vuelve a su valor por defecto y los demás se conservan', async () => {
  saved({ bpm: 500, meter: '6/8' })

  expect(await readPanel(renderApp())).toEqual({ ...DEFAULTS, meter: '6/8' })
})

test('las notas guardadas se limpian: sin repetidas y en orden cromático', async () => {
  saved({ notes: ['B', 'C', 'B', 'F'] })

  expect((await readPanel(renderApp())).notes).toEqual(['C', 'F', 'B'])
})

test('los datos de otra versión se descartan', async () => {
  saved({ bpm: 90 }, 2)

  expect((await readPanel(renderApp())).bpm).toBe('60')
})

test('sin almacenamiento, la app funciona igual', async () => {
  const broken = () => {
    throw new Error('sin almacenamiento')
  }
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(broken)
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(broken)

  const app = renderApp()
  const panel = await app.openSettings()
  await app.typeNumber(panel.getByRole('spinbutton', { name: 'BPM' }), '90')
  await app.closeSettings()
  await app.user.click(screen.getByRole('button', { name: 'Play' }))

  expect(app.fake.running).toBe(true)
  expect(app.fake.bpm).toBe(90)
  vi.restoreAllMocks()
})
