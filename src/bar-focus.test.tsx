import { screen, waitFor, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { renderApp } from '@/test/app'

type App = ReturnType<typeof renderApp>

/** Pasa al modo progresión, abre el editor y escribe `text`. */
async function write(app: App, text: string) {
  const panel = await app.openSettings()
  await app.user.click(
    within(panel.getByRole('radiogroup', { name: 'Modo' })).getByRole('radio', {
      name: 'Progresión'
    })
  )
  await app.user.click(panel.getByRole('button', { name: 'Nueva progresión' }))
  const editor = within(
    screen.getByRole('main', { name: 'Editor de progresiones' })
  )
  await app.user.type(editor.getByRole('textbox', { name: 'Acordes' }), text)
  return editor
}

/** Toca un compás, y devuelve la hoja que abre. */
async function open(app: App, bar: string, sheet: string) {
  await app.user.click(
    within(screen.getByRole('main')).getByRole('button', { name: bar })
  )
  return within(screen.getByRole('dialog', { name: sheet }))
}

/** El nombre del botón que recibe el foco cuando la hoja termina de cerrarse. */
const focusedName = () =>
  waitFor(() => {
    const { activeElement } = document
    if (activeElement?.tagName !== 'BUTTON') throw new Error('sin foco')
    return activeElement.getAttribute('aria-label')
  })

test('al cerrar la hoja con Cerrar, el foco vuelve al compás', async () => {
  const app = renderApp()
  await write(app, 'C7 | F7')

  const sheet = await open(app, 'Compás 2: F7', 'Compás 2')
  await app.user.click(sheet.getByRole('button', { name: 'Cerrar' }))

  expect(await focusedName()).toBe('Compás 2: F7')
})

test('al cerrar la hoja con Escape, el foco vuelve a la parte', async () => {
  const app = renderApp()
  await write(app, 'C7 A7 | F7')

  await open(app, 'Compás 1, parte 2: A7', 'Compás 1, parte 2')
  await app.user.keyboard('{Escape}')

  expect(await focusedName()).toBe('Compás 1, parte 2: A7')
})

test('Duplicar devuelve el foco al compás que se duplicó', async () => {
  const app = renderApp()
  await write(app, 'C7 | F7 | G7')

  const sheet = await open(app, 'Compás 2: F7', 'Compás 2')
  await app.user.click(sheet.getByRole('button', { name: 'Duplicar' }))

  expect(await focusedName()).toBe('Compás 2: F7')
})

test('Partir devuelve el foco a la primera parte del compás', async () => {
  const app = renderApp()
  await write(app, 'C7 | F7')

  const sheet = await open(app, 'Compás 2: F7', 'Compás 2')
  await app.user.click(sheet.getByRole('button', { name: 'Partir' }))

  expect(await focusedName()).toBe('Compás 2, parte 1: F7')
})

test('Unir devuelve el foco al compás que queda', async () => {
  const app = renderApp()
  await write(app, 'C7 | F7 G7')

  const sheet = await open(app, 'Compás 2, parte 2: G7', 'Compás 2, parte 2')
  await app.user.click(sheet.getByRole('button', { name: 'Unir' }))

  expect(await focusedName()).toBe('Compás 2: F7')
})

test('Quitar devuelve el foco al compás que ocupa su lugar', async () => {
  const app = renderApp()
  await write(app, 'C7 | F7 | G7')

  const sheet = await open(app, 'Compás 2: F7', 'Compás 2')
  await app.user.click(sheet.getByRole('button', { name: 'Quitar' }))

  expect(await focusedName()).toBe('Compás 2: G7')
})

test('Quitar el último compás devuelve el foco al que queda último', async () => {
  const app = renderApp()
  await write(app, 'C7 | F7 | G7')

  const sheet = await open(app, 'Compás 3: G7', 'Compás 3')
  await app.user.click(sheet.getByRole('button', { name: 'Quitar' }))

  expect(await focusedName()).toBe('Compás 2: F7')
})
