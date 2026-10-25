import { screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { renderApp, type FakeEngine } from '@/test/app'

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
const pickFigure = (app: App, name: string) =>
  pick(app, 'Figura del bajo', name)
const pickMeter = (app: App, id: string) => pick(app, 'Compás', id)

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

/** Las partes de un compás del editor: los botones `Compás {bar}, parte {k}: …`. */
const parts = (editor: Editor, bar: number) =>
  editor.getAllByRole('button', { name: new RegExp(`^Compás ${bar}, parte`) })

const label = (button: HTMLElement) => button.getAttribute('aria-label')
const at = (button: Element) => button.getAttribute('data-at')

/** Pasa al modo progresión, abre el editor y escribe `text`. */
async function write(app: App, text: string) {
  await pickMode(app, 'Progresión')
  const editor = await newProgression(app)
  await app.user.type(chords(editor), text)
  return editor
}

const laneBars = () =>
  within(screen.getByRole('list', { name: 'Carril' })).getAllByRole('listitem')

const soundsOf = (fake: FakeEngine, bar: number, kind: 'bass' | 'chord') =>
  fake.played.filter((event) => event.bar === bar && event.sound.kind === kind)

test('un compás con dos acordes se ve partido', async () => {
  const app = renderApp()
  const editor = await write(app, 'Cmaj7 | C7 A7 | Dm7 G7')

  expect(
    within(editor.getByRole('list', { name: 'Compases' })).getAllByRole(
      'listitem'
    )
  ).toHaveLength(3)
  expect(parts(editor, 2).map(label)).toEqual([
    'Compás 2, parte 1: C7',
    'Compás 2, parte 2: A7'
  ])
  expect(parts(editor, 2).map(at)).toEqual(['0', '2'])
  app.unmount()

  const sevenEight = renderApp()
  await pickMeter(sevenEight, '7/8')
  const other = await write(sevenEight, 'Cmaj7 | C7 A7 | Dm7 G7')
  expect(parts(other, 2).map(at)).toEqual(['0', '4'])
})

test('el carril de práctica y el sonido se parten igual', async () => {
  const app = renderApp()
  await pickMode(app, 'Progresión')
  await pickSound(app, 'Bajo + acorde')
  await pickFigure(app, 'Redondas')
  const editor = await newProgression(app)
  await app.user.type(chords(editor), 'Cmaj7 | C7 A7 | Dm7 G7')
  await app.user.click(editor.getByRole('button', { name: 'Guardar' }))
  await app.user.click(editor.getByRole('button', { name: 'Listo' }))
  await play(app)
  app.fake.beat(4 + 4 + 4)

  expect(
    Array.from(laneBars()[1].querySelectorAll('[data-at]')).map(at)
  ).toEqual(['0', '2'])
  expect(
    soundsOf(app.fake, 2, 'bass').map(({ beat, sound }) => [
      beat,
      sound.kind === 'bass' && sound.pitch
    ])
  ).toEqual([
    [0, 'C2'],
    [2, 'A2']
  ])
  expect(soundsOf(app.fake, 2, 'chord')).toHaveLength(2)
})

test('tres acordes en un compás es un error', async () => {
  const app = renderApp()
  const editor = await write(app, 'C | Dm7 G7 C')

  expect(
    editor.getByRole('textbox', { name: 'Acordes', description: /«Dm7 G7 C»/ })
  ).toBeDefined()
  expect(editor.getByRole('button', { name: 'Guardar' })).toHaveProperty(
    'disabled',
    true
  )
})

test('Partir y Unir', async () => {
  const app = renderApp()
  const editor = await write(app, 'C7 | F7')

  await app.user.click(editor.getByRole('button', { name: 'Compás 1: C7' }))
  await app.user.click(
    within(screen.getByRole('dialog', { name: 'Compás 1' })).getByRole(
      'button',
      { name: 'Partir' }
    )
  )
  expect(parts(editor, 1).map(label)).toEqual([
    'Compás 1, parte 1: C7',
    'Compás 1, parte 2: C7'
  ])
  expect(chords(editor).value).toBe('C7 C7 | F7')

  await app.user.click(
    editor.getByRole('button', { name: 'Compás 1, parte 2: C7' })
  )
  const second = within(
    screen.getByRole('dialog', { name: 'Compás 1, parte 2' })
  )
  await app.user.click(
    within(second.getByRole('radiogroup', { name: 'Raíz' })).getByRole(
      'radio',
      { name: 'La' }
    )
  )
  await app.user.selectOptions(
    second.getByRole('combobox', { name: 'Tipo de acorde' }),
    'C7 · séptima'
  )
  await app.user.click(second.getByRole('button', { name: 'Cerrar' }))
  expect(chords(editor).value).toBe('C7 A7 | F7')

  await app.user.click(
    editor.getByRole('button', { name: 'Compás 1, parte 2: A7' })
  )
  await app.user.click(
    within(screen.getByRole('dialog', { name: 'Compás 1, parte 2' })).getByRole(
      'button',
      { name: 'Unir' }
    )
  )
  expect(editorBars(editor)).toEqual(['Compás 1: C7', 'Compás 2: F7'])
  expect(chords(editor).value).toBe('C7 | F7')
})

test('Duplicar inserta la copia justo después', async () => {
  const app = renderApp()
  const editor = await write(app, 'C7 | F7 | G7')

  await app.user.click(editor.getByRole('button', { name: 'Compás 2: F7' }))
  await app.user.click(
    within(screen.getByRole('dialog', { name: 'Compás 2' })).getByRole(
      'button',
      { name: 'Duplicar' }
    )
  )

  expect(chords(editor).value).toBe('C7 | F7 | F7 | G7')
  expect(
    within(editor.getByRole('list', { name: 'Compases' })).getAllByRole(
      'listitem'
    )
  ).toHaveLength(4)
})
