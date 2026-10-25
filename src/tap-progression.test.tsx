import { screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { NOTES } from '@/music/notes'
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
    .queryAllByRole('button')
    .map((button) => button.getAttribute('aria-label'))

/** Toca el compás `bar`, elige raíz y tipo en su selector y lo cierra. */
async function pickChord(
  app: App,
  editor: Editor,
  bar: number,
  root: string,
  type: string
) {
  await app.user.click(
    editor.getByRole('button', { name: new RegExp(`^Compás ${bar}: `) })
  )
  const sheet = within(screen.getByRole('dialog', { name: `Compás ${bar}` }))
  await app.user.click(
    within(sheet.getByRole('radiogroup', { name: 'Raíz' })).getByRole('radio', {
      name: root
    })
  )
  await app.user.selectOptions(
    sheet.getByRole('combobox', { name: 'Tipo de acorde' }),
    type
  )
  await app.user.click(sheet.getByRole('button', { name: 'Cerrar' }))
}

/** Las familias y sus opciones, tal como las muestra un selector de tipo de acorde. */
const typesOf = (select: HTMLElement) =>
  within(select)
    .getAllByRole('group')
    .map((group) => [
      (group as HTMLOptGroupElement).label,
      within(group)
        .getAllByRole('option')
        .map((option) => option.textContent)
    ])

test('Agregar compás en una nueva da la tríada de la tónica', async () => {
  const major = renderApp()
  await pickMode(major, 'Progresión')
  let editor = await newProgression(major)
  await major.user.click(editor.getByRole('button', { name: 'Agregar compás' }))

  expect(editorBars(editor)).toEqual(['Compás 1: C'])
  expect(chords(editor).value).toBe('C')
  major.unmount()

  const minor = renderApp()
  await pickMode(minor, 'Progresión')
  editor = await newProgression(minor)
  await minor.user.click(
    within(
      editor.getByRole('radiogroup', { name: 'Tipo de tonalidad' })
    ).getByRole('radio', { name: 'Menor' })
  )
  await minor.user.click(editor.getByRole('button', { name: 'Agregar compás' }))

  expect(editorBars(editor)).toEqual(['Compás 1: Cm'])
})

test('Agregar compás copia el último', async () => {
  const app = renderApp()
  await pickMode(app, 'Progresión')
  const editor = await newProgression(app)
  await app.user.type(chords(editor), 'Dm7 G7')
  await app.user.click(editor.getByRole('button', { name: 'Agregar compás' }))

  expect(editorBars(editor)).toEqual([
    'Compás 1: Dm7',
    'Compás 2: G7',
    'Compás 3: G7'
  ])
  expect(chords(editor).value).toBe('Dm7 | G7 | G7')
})

test('el selector de un compás tiene las raíces y los tipos de ajustes', async () => {
  const app = renderApp()
  const panel = await app.openSettings()
  await app.user.click(panel.getByRole('radio', { name: 'Bajo + acorde' }))
  const expected = typesOf(
    panel.getByRole('combobox', { name: 'Tipo de acorde' })
  )
  await app.closeSettings()

  await pickMode(app, 'Progresión')
  const editor = await newProgression(app)
  await app.user.click(editor.getByRole('button', { name: 'Agregar compás' }))
  await app.user.click(
    editor.getByRole('button', { name: new RegExp('^Compás 1: ') })
  )

  const sheet = within(screen.getByRole('dialog', { name: 'Compás 1' }))
  const roots = within(
    sheet.getByRole('radiogroup', { name: 'Raíz' })
  ).getAllByRole('radio')
  expect(roots.map((radio) => radio.getAttribute('aria-label'))).toEqual(
    NOTES.map(({ name }) => name)
  )
  expect(roots.map((radio) => radio.textContent)).toEqual(
    NOTES.map(({ label }) => label)
  )
  expect(roots.map((radio) => radio.getAttribute('aria-checked'))).toEqual(
    NOTES.map(({ name }) => String(name === 'Do'))
  )
  expect(
    typesOf(sheet.getByRole('combobox', { name: 'Tipo de acorde' }))
  ).toEqual(expected)
})

test('elegir raíz y tipo cambia el compás y el texto', async () => {
  const app = renderApp()
  await pickMode(app, 'Progresión')
  const editor = await newProgression(app)
  await app.user.type(chords(editor), 'C G')
  await pickChord(app, editor, 1, 'Fa', 'Cm7 · menor séptima')

  expect(editorBars(editor)).toEqual(['Compás 1: Fm7', 'Compás 2: G'])
  expect(chords(editor).value).toBe('Fm7 | G')
})

test('Quitar', async () => {
  const app = renderApp()
  await pickMode(app, 'Progresión')
  const editor = await newProgression(app)
  await app.user.type(chords(editor), 'Dm7')
  await app.user.click(
    editor.getByRole('button', { name: new RegExp('^Compás 1: ') })
  )
  const alone = within(screen.getByRole('dialog', { name: 'Compás 1' }))
  expect(alone.getByRole('button', { name: 'Quitar' })).toHaveProperty(
    'disabled',
    true
  )
  await app.user.click(alone.getByRole('button', { name: 'Cerrar' }))

  await app.user.type(chords(editor), ' G7')
  await app.user.click(
    editor.getByRole('button', { name: new RegExp('^Compás 1: ') })
  )
  await app.user.click(
    within(screen.getByRole('dialog', { name: 'Compás 1' })).getByRole(
      'button',
      { name: 'Quitar' }
    )
  )

  // Quitar cierra el selector: el carril vuelve a ser accesible
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(editorBars(editor)).toEqual(['Compás 1: G7'])
  expect(chords(editor).value).toBe('G7')
})

test('editar tocando reemplaza un texto con error', async () => {
  const app = renderApp()
  await pickMode(app, 'Progresión')
  const editor = await newProgression(app)
  await app.user.type(chords(editor), 'Dm7 Hm7')
  expect(chords(editor).getAttribute('aria-invalid')).toBe('true')
  await pickChord(app, editor, 1, 'Mi', 'Cm7 · menor séptima')

  expect(chords(editor).value).toBe('Em7')
  expect(chords(editor).getAttribute('aria-invalid')).toBeNull()
})

test('tocando suena igual que escribiendo', async () => {
  const app = renderApp()
  await pickMode(app, 'Progresión')
  await pickSound(app, 'Bajo + acorde')

  // armada tocando
  let editor = await newProgression(app)
  const add = () =>
    app.user.click(editor.getByRole('button', { name: 'Agregar compás' }))
  await add()
  await pickChord(app, editor, 1, 'Re', 'Cm7 · menor séptima')
  await add()
  await pickChord(app, editor, 2, 'Sol', 'C7 · séptima')
  await add()
  await pickChord(app, editor, 3, 'Do', 'Cmaj7 · séptima mayor')
  await add()
  expect(chords(editor).value).toBe('Dm7 | G7 | Cmaj7 | Cmaj7')
  await app.user.click(editor.getByRole('button', { name: 'Guardar' }))
  await app.user.click(editor.getByRole('button', { name: 'Listo' }))

  // sin la cuenta de entrada, que es el primer compás de cada Play
  const tapped = app.fake.bars.length
  await play(app)
  app.fake.beat(4 + 4 * 4)
  const expected = app.fake.bars.slice(tapped + 1)
  await app.user.click(screen.getByRole('button', { name: 'Stop' }))

  // la misma, escrita
  editor = await newProgression(app)
  await app.user.type(chords(editor), 'Dm7 G7 Cmaj7 Cmaj7')
  await app.user.click(editor.getByRole('button', { name: 'Guardar' }))
  await app.user.click(editor.getByRole('button', { name: 'Listo' }))

  const written = app.fake.bars.length
  await play(app)
  app.fake.beat(4 + 4 * 4)

  expect(expected).toHaveLength(4)
  expect(app.fake.bars.slice(written + 1)).toEqual(expected)
})
