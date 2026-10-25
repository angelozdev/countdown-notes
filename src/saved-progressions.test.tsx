import { screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { renderApp } from '@/test/app'

type App = ReturnType<typeof renderApp>
type Panel = ReturnType<typeof within>

const SETTINGS_KEY = 'countdown-notes:ajustes'
const PROGRESSIONS_KEY = 'countdown-notes:progresiones'

const andaluza = {
  id: 'propia-1',
  name: 'Andaluza mía',
  key: { tonic: 'A', type: 'minor' },
  bars: [
    [{ root: 'A', type: 'm' }],
    [{ root: 'G', type: 'maj' }],
    [{ root: 'F', type: 'maj' }],
    [{ root: 'E', type: 'maj' }]
  ]
}

/** Escribe lo guardado a mano, antes de montar la app. */
function stored(progressions: unknown[]) {
  localStorage.setItem(
    PROGRESSIONS_KEY,
    JSON.stringify({ version: 1, progressions })
  )
}

function savedSettings(settings: unknown) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({ version: 1, settings }))
}

/** Abre el panel, toca "Nueva progresión" y devuelve el editor. */
async function newProgression(app: App) {
  const panel = await app.openSettings()
  await app.user.click(panel.getByRole('button', { name: 'Nueva progresión' }))
  return within(screen.getByRole('main', { name: 'Editor de progresiones' }))
}

const chords = (editor: Panel) =>
  editor.getByRole('textbox', { name: 'Acordes' }) as HTMLTextAreaElement

/** Pasa al modo progresión, crea una progresión, la escribe, la guarda y sale del editor. */
async function createAndSave(app: App, text: string) {
  const panel = await app.openSettings()
  await app.user.click(
    within(panel.getByRole('radiogroup', { name: 'Modo' })).getByRole('radio', {
      name: 'Progresión'
    })
  )
  await app.closeSettings()
  const editor = await newProgression(app)
  await app.user.type(chords(editor), text)
  await app.user.click(editor.getByRole('button', { name: 'Guardar' }))
  await app.user.click(editor.getByRole('button', { name: 'Listo' }))
}

const progressionSelect = (panel: Panel) =>
  panel.getByRole('combobox', { name: 'Progresión' }) as HTMLSelectElement

/** Los grupos del selector de progresión, con sus opciones. */
const groups = (panel: Panel) =>
  within(progressionSelect(panel))
    .getAllByRole('group')
    .map((group) => ({
      label: group.getAttribute('label'),
      options: within(group)
        .getAllByRole('option')
        .map((option) => option.textContent)
    }))

test('una progresión guardada sigue al reabrir la app', async () => {
  const first = renderApp()
  await createAndSave(first, 'Dm7 G7 Cmaj7 Cmaj7')
  first.unmount()

  const app = renderApp()
  const panel = await app.openSettings()
  expect(groups(panel)[0]).toEqual({
    label: 'Mis progresiones',
    options: ['Progresión 1']
  })
  expect(progressionSelect(panel).value).toBe('propia-1')
  await app.closeSettings()
  expect(screen.getByText(/^Progresión 1 · Do mayor/)).toBeDefined()
})

test('Editar progresión solo con una propia elegida', async () => {
  stored([andaluza])
  savedSettings({ mode: 'progression' })
  const app = renderApp()
  let panel = await app.openSettings()

  expect(panel.queryByRole('button', { name: 'Editar progresión' })).toBeNull()

  await app.user.selectOptions(progressionSelect(panel), 'Andaluza mía')
  await app.user.click(panel.getByRole('button', { name: 'Editar progresión' }))

  panel = within(screen.getByRole('main', { name: 'Editor de progresiones' }))
  expect(chords(panel).value).toBe('Am | G | F | E')
})

test('las progresiones inválidas se descartan una a una', async () => {
  savedSettings({ mode: 'progression' })
  stored([
    andaluza,
    { ...andaluza, id: 'propia-3', bars: [] },
    {
      ...andaluza,
      id: 'propia-4',
      bars: [[{ root: 'A', type: 'xx' }]]
    },
    { ...andaluza, id: 'propia-5', name: '   ' },
    {
      ...andaluza,
      id: 'propia-6',
      bars: [[{ root: 'H', type: 'm' }]]
    },
    { ...andaluza, id: 'propia-2', name: 'Otra' },
    { ...andaluza, name: 'Repetida' }
  ])
  const app = renderApp()
  const panel = await app.openSettings()

  expect(groups(panel)[0]).toEqual({
    label: 'Mis progresiones',
    options: ['Andaluza mía', 'Otra']
  })
})

test('datos rotos no rompen la app ni los ajustes', async () => {
  for (const broken of [
    'no es json',
    JSON.stringify({ version: 2, progressions: [andaluza] })
  ]) {
    savedSettings({ mode: 'progression', bpm: 90 })
    localStorage.setItem(PROGRESSIONS_KEY, broken)
    const app = renderApp()
    const panel = await app.openSettings()

    expect(
      within(progressionSelect(panel)).queryByRole('group', {
        name: 'Mis progresiones'
      })
    ).toBeNull()
    await app.closeSettings()
    expect(screen.getByText(/ · 90 BPM · /)).toBeDefined()
    app.unmount()
  }
})

test('una progresión elegida que ya no existe deja el ii–V–I mayor', () => {
  savedSettings({ mode: 'progression', progression: 'propia-7' })
  renderApp()

  expect(screen.getByText(/^ii–V–I mayor · Do mayor/)).toBeDefined()
})

test('los ajustes de la entrega 4 se conservan', () => {
  savedSettings({
    mode: 'progression',
    progression: 'blues-jazz',
    tonic: 'F',
    bpm: 100
  })
  renderApp()

  expect(
    screen.getByText(
      'Blues de jazz · Fa mayor · Analógico cálido · 100 BPM · 4/4'
    )
  ).toBeDefined()
})

const nameField = (editor: Panel) =>
  editor.getByRole('textbox', { name: 'Nombre' }) as HTMLInputElement

test('el nombre por defecto es el primer número libre', async () => {
  savedSettings({ mode: 'progression' })
  const first = renderApp()
  const editor = await newProgression(first)
  expect(nameField(editor).value).toBe('Progresión 1')
  await first.user.type(chords(editor), 'Dm7 G7 Cmaj7 Cmaj7')
  await first.user.click(editor.getByRole('button', { name: 'Guardar' }))
  await first.user.click(editor.getByRole('button', { name: 'Listo' }))
  expect(nameField(await newProgression(first)).value).toBe('Progresión 2')
  first.unmount()

  stored([{ ...andaluza, name: 'Progresión 2' }])
  const app = renderApp()
  expect(nameField(await newProgression(app)).value).toBe('Progresión 1')
})

test('renombrar cambia el selector y la línea de estado', async () => {
  stored([andaluza])
  savedSettings({ mode: 'progression', progression: 'propia-1', tonic: 'A' })
  const first = renderApp()
  const panel = await first.openSettings()
  await first.user.click(
    panel.getByRole('button', { name: 'Editar progresión' })
  )
  const editor = within(
    screen.getByRole('main', { name: 'Editor de progresiones' })
  )
  await first.user.clear(nameField(editor))
  await first.user.type(nameField(editor), 'Andaluza de La')
  await first.user.click(editor.getByRole('button', { name: 'Guardar' }))
  await first.user.click(editor.getByRole('button', { name: 'Listo' }))

  expect(screen.getByText(/^Andaluza de La · La menor/)).toBeDefined()
  expect(groups(await first.openSettings())[0].options).toEqual([
    'Andaluza de La'
  ])
  await first.closeSettings()
  first.unmount()

  const app = renderApp()
  expect(screen.getByText(/^Andaluza de La · La menor/)).toBeDefined()
  expect(groups(await app.openSettings())[0].options).toEqual([
    'Andaluza de La'
  ])
})

test('un nombre vacío conserva el anterior', async () => {
  stored([andaluza])
  savedSettings({ mode: 'progression', progression: 'propia-1', tonic: 'A' })
  const app = renderApp()
  const panel = await app.openSettings()
  await app.user.click(panel.getByRole('button', { name: 'Editar progresión' }))
  const editor = within(
    screen.getByRole('main', { name: 'Editor de progresiones' })
  )
  await app.user.clear(nameField(editor))
  await app.user.clear(chords(editor))
  await app.user.type(chords(editor), 'Am G F E Dm')
  await app.user.click(editor.getByRole('button', { name: 'Guardar' }))
  await app.user.click(editor.getByRole('button', { name: 'Listo' }))

  expect(screen.getByText(/^Andaluza mía · La menor/)).toBeDefined()
})

/** Lo marcado en un grupo de radios: sus nombres accesibles. */
const checked = (group: HTMLElement) =>
  within(group)
    .getAllByRole('radio')
    .filter((radio) => radio.getAttribute('aria-checked') === 'true')
    .map((radio) => radio.getAttribute('aria-label') ?? radio.textContent)

const laneBars = () =>
  within(screen.getByRole('list', { name: 'Carril' }))
    .getAllByRole('listitem')
    .map((bar) => bar.textContent)

test('la tonalidad de origen empieza en la de ajustes, en mayor', async () => {
  savedSettings({ mode: 'progression', tonic: 'F' })
  const app = renderApp()
  const editor = await newProgression(app)

  expect(
    checked(editor.getByRole('radiogroup', { name: 'Tonalidad de origen' }))
  ).toEqual(['Fa'])
  expect(
    checked(editor.getByRole('radiogroup', { name: 'Tipo de tonalidad' }))
  ).toEqual(['Mayor'])
})

test('cambiar la tonalidad no cambia lo escrito', async () => {
  savedSettings({ mode: 'progression' })
  const app = renderApp()
  const editor = await newProgression(app)
  await app.user.type(chords(editor), 'Am G F E')
  const origin = within(
    editor.getByRole('radiogroup', { name: 'Tonalidad de origen' })
  )
  await app.user.click(origin.getByRole('radio', { name: 'La' }))
  await app.user.click(
    within(
      editor.getByRole('radiogroup', { name: 'Tipo de tonalidad' })
    ).getByRole('radio', { name: 'Menor' })
  )

  expect(chords(editor).value).toBe('Am G F E')
  expect(origin.getByRole('radio', { name: 'Do sostenido' })).toBeDefined()
  await app.user.click(editor.getByRole('button', { name: 'Guardar' }))
  await app.user.click(editor.getByRole('button', { name: 'Listo' }))
  expect(screen.getByText(/^Progresión 1 · La menor/)).toBeDefined()
})

test('al elegirla, la tónica pasa a la suya', async () => {
  stored([andaluza])
  savedSettings({ mode: 'progression' })
  const app = renderApp()
  let panel = await app.openSettings()
  await app.user.selectOptions(progressionSelect(panel), 'Andaluza mía')

  expect(checked(panel.getByRole('radiogroup', { name: 'Tonalidad' }))).toEqual(
    ['La']
  )
  await app.closeSettings()
  await app.user.click(screen.getByRole('button', { name: 'Play' }))
  app.fake.beat(5)
  expect(laneBars()).toEqual(['Am', 'G', 'F', 'E'])

  await app.user.click(screen.getByRole('button', { name: 'Stop' }))
  panel = await app.openSettings()
  await app.user.click(
    within(panel.getByRole('radiogroup', { name: 'Tonalidad' })).getByRole(
      'radio',
      { name: 'Do' }
    )
  )
  await app.closeSettings()
  await app.user.click(screen.getByRole('button', { name: 'Play' }))
  app.fake.beat(5)
  expect(laneBars()).toEqual(['Cm', 'B♭', 'A♭', 'G'])
})
