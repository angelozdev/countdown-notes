import { screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { renderApp } from '@/test/app'

type App = ReturnType<typeof renderApp>
type Editor = ReturnType<typeof within>

/** Abre el panel, toca un radio de un grupo y lo cierra. */
async function pick(app: App, group: string, name: string) {
  const panel = await app.openSettings()
  await app.user.click(
    within(panel.getByRole('radiogroup', { name: group })).getByRole('radio', {
      name
    })
  )
  await app.closeSettings()
}

const pickMode = (app: App, name: string) => pick(app, 'Modo', name)
const pickSound = (app: App, name: string) => pick(app, 'Qué suena', name)

async function play(app: App) {
  await app.user.click(screen.getByRole('button', { name: 'Play' }))
}

/** Abre el panel, toca "Nueva progresión" y devuelve el editor. */
async function newProgression(app: App) {
  const panel = await app.openSettings()
  await app.user.click(panel.getByRole('button', { name: 'Nueva progresión' }))
  return within(screen.getByRole('main', { name: 'Editor de progresiones' }))
}

const chords = (editor: Editor) =>
  editor.getByRole('textbox', { name: 'Acordes' }) as HTMLTextAreaElement

const editorBars = (editor: Editor) =>
  within(editor.getByRole('list', { name: 'Compases' }))
    .getAllByRole('button')
    .map((button) => button.getAttribute('aria-label'))

const laneBars = () =>
  within(screen.getByRole('list', { name: 'Carril' }))
    .getAllByRole('listitem')
    .map((bar) => bar.textContent)

test('Nueva progresión está solo en el modo progresión', async () => {
  const app = renderApp()
  expect(
    (await app.openSettings()).queryByRole('button', {
      name: 'Nueva progresión'
    })
  ).toBeNull()
  await app.closeSettings()

  await pickMode(app, 'Progresión')
  expect(
    (await app.openSettings()).getByRole('button', { name: 'Nueva progresión' })
  ).toBeDefined()
})

test('abre el editor a pantalla completa', async () => {
  const app = renderApp()
  await pickMode(app, 'Progresión')
  const editor = await newProgression(app)

  expect(screen.queryByRole('region', { name: 'Ahora' })).toBeNull()
  expect(chords(editor).value).toBe('')
})

test('escribir llena el carril del editor', async () => {
  const app = renderApp()
  await pickMode(app, 'Progresión')
  const editor = await newProgression(app)
  await app.user.type(chords(editor), 'Dm7 G7 Cmaj7 Cmaj7')

  expect(editorBars(editor)).toEqual([
    'Compás 1: Dm7',
    'Compás 2: G7',
    'Compás 3: Cmaj7',
    'Compás 4: Cmaj7'
  ])
})

test('un acorde no reconocido se marca y no deja guardar', async () => {
  const app = renderApp()
  await pickMode(app, 'Progresión')
  const editor = await newProgression(app)
  await app.user.type(chords(editor), 'Dm7 Hm7 G7')

  expect(chords(editor).getAttribute('aria-invalid')).toBe('true')
  expect(
    editor.getByRole('textbox', { name: 'Acordes', description: /«Hm7»/ })
  ).toBeDefined()
  expect(editorBars(editor)).toEqual(['Compás 1: Dm7'])
  expect(editor.getByRole('button', { name: 'Guardar' })).toHaveProperty(
    'disabled',
    true
  )
})

test('guardada, queda elegida y suena en la práctica', async () => {
  const app = renderApp()
  await pickMode(app, 'Progresión')
  const editor = await newProgression(app)
  await app.user.type(chords(editor), 'Dm7 G7 Cmaj7 Cmaj7')
  await app.user.click(editor.getByRole('button', { name: 'Guardar' }))
  await app.user.click(editor.getByRole('button', { name: 'Listo' }))

  expect(
    screen.getByText(
      'Progresión 1 · Do mayor · Analógico cálido · 60 BPM · 4/4'
    )
  ).toBeDefined()
  const panel = await app.openSettings()
  const select = panel.getByRole('combobox', {
    name: 'Progresión'
  }) as HTMLSelectElement
  expect(select.value).toBe('propia-1')
  const groups = within(select).getAllByRole('group')
  expect(groups[0]).toBe(
    within(select).getByRole('group', { name: 'Mis progresiones' })
  )
  expect(
    within(groups[0])
      .getAllByRole('option')
      .map((option) => option.textContent)
  ).toEqual(['Progresión 1'])
  await app.closeSettings()

  await play(app)
  app.fake.beat(5)
  expect(laneBars()).toEqual(['Dm7', 'G7', 'Cmaj7', 'Cmaj7'])
})

test('suena igual que el ii–V–I mayor de la biblioteca', async () => {
  const app = renderApp()
  await pickMode(app, 'Progresión')
  await pickSound(app, 'Bajo + acorde')

  // sin la cuenta de entrada, que es el primer compás de cada Play
  const library = app.fake.bars.length
  await play(app)
  app.fake.beat(4 + 8 * 4)
  const expected = app.fake.bars.slice(library + 1)
  await app.user.click(screen.getByRole('button', { name: 'Stop' }))

  const editor = await newProgression(app)
  await app.user.type(chords(editor), 'Dm7 G7 Cmaj7 Cmaj7')
  await app.user.click(editor.getByRole('button', { name: 'Guardar' }))
  await app.user.click(editor.getByRole('button', { name: 'Listo' }))

  const mine = app.fake.bars.length
  await play(app)
  app.fake.beat(4 + 8 * 4)

  expect(expected).toHaveLength(8)
  expect(app.fake.bars.slice(mine + 1)).toEqual(expected)
})

test('crear una progresión detiene la que suena', async () => {
  const app = renderApp()
  await pickMode(app, 'Progresión')
  await play(app)
  app.fake.beat(5)
  expect(app.fake.running).toBe(true)

  await newProgression(app)
  expect(app.fake.running).toBe(false)
})
