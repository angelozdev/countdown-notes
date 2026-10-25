import { expect, test } from '@playwright/test'

test('abre la pantalla de práctica', async ({ page }) => {
  await page.goto('/')
  await expect(
    page.getByRole('heading', { level: 1, name: 'Countdown Notes' })
  ).toBeAttached()
  await expect(page.getByRole('button', { name: 'Play' })).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('lang', 'es')
  const hasHorizontalScroll = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth
  )
  expect(hasHorizontalScroll).toBe(false)
})

test('se ve en oscuro con acento ámbar aunque el sistema esté en claro', async ({
  page
}) => {
  await page.emulateMedia({ colorScheme: 'light' })
  await page.goto('/')
  await expect(page.locator('body')).toHaveCSS(
    'background-color',
    'rgb(10, 10, 10)'
  )
  await expect(page.getByRole('button', { name: 'Play' })).toHaveCSS(
    'background-color',
    'rgb(245, 165, 36)'
  )
})

test('Play cambia a Stop y Stop vuelve a Play', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Play' }).click()
  await page.getByRole('button', { name: 'Stop' }).click()
  await expect(page.getByRole('button', { name: 'Play' })).toBeVisible()
})

test('Play cuenta, muestra una nota con su nombre y Stop la detiene', async ({
  page
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Ajustes' }).click()
  const bpm = page.getByRole('spinbutton', { name: 'BPM' })
  await bpm.fill('240')
  await bpm.press('Enter')
  await page.getByRole('button', { name: 'Cerrar' }).click()

  await page.getByRole('button', { name: 'Play' }).click()
  const ahora = page.getByRole('region', { name: 'Ahora' })
  await expect(ahora).toHaveText(/^\s*[1-4]\s*$/)
  await expect(ahora).toContainText(/Do|Re|Mi|Fa|Sol|La|Si/)
  await expect(
    page.getByRole('list', { name: 'Carril' }).locator('[aria-current="true"]')
  ).toBeVisible()

  await page.getByRole('button', { name: 'Stop' }).click()
  await expect(page.getByRole('button', { name: 'Play' })).toBeVisible()
})

test('la barra espaciadora hace Play y Stop una vez por pulsación', async ({
  page
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Play' }).focus()

  await page.keyboard.press('Space')
  await expect(page.getByRole('button', { name: 'Stop' })).toBeVisible()
  await page.keyboard.press('Space')
  await expect(page.getByRole('button', { name: 'Play' })).toBeVisible()
  expect(await page.evaluate(() => window.scrollY)).toBe(0)
})

test('los ajustes siguen después de recargar', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Ajustes' }).click()
  const bpm = page.getByRole('spinbutton', { name: 'BPM' })
  await bpm.fill('90')
  await bpm.press('Enter')
  await page.getByRole('radio', { name: '6/8' }).click()
  await page.getByRole('button', { name: 'Cerrar' }).click()

  await page.reload()
  await expect(
    page.getByText('Aleatorio · Analógico cálido · 90 BPM · 6/8')
  ).toBeVisible()
})

test.describe('en un celular angosto', () => {
  test.use({ viewport: { width: 320, height: 640 } })

  test('el cifrado más largo cabe a 320 px', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Ajustes' }).click()
    const bpm = page.getByRole('spinbutton', { name: 'BPM' })
    await bpm.fill('240')
    await bpm.press('Enter')
    await page.getByRole('button', { name: 'Excluir naturales' }).click()
    for (const flat of ['D♭', 'E♭', 'A♭']) {
      await page.getByRole('button', { name: flat, exact: true }).click()
    }
    await page.getByRole('radio', { name: 'Bajo + acorde' }).click()
    await page
      .getByRole('combobox', { name: 'Tipo de acorde' })
      .selectOption({ label: 'Cm(maj7) · menor séptima mayor' })
    await page.getByRole('button', { name: 'Cerrar' }).click()

    await page.getByRole('button', { name: 'Play' }).click()
    const ahora = page.getByRole('region', { name: 'Ahora' })
    await expect(ahora).toContainText('m(maj7)')

    const symbol = ahora.getByText('m(maj7)')
    const box = await symbol.boundingBox()
    expect(box?.x).toBeGreaterThanOrEqual(0)
    expect(box ? box.x + box.width : Infinity).toBeLessThanOrEqual(320)
    expect(await symbol.evaluate(fits)).toBe(true)

    const bars = await page
      .getByRole('list', { name: 'Carril' })
      .getByRole('listitem')
      .all()
    expect(bars.length).toBeGreaterThan(0)
    for (const bar of bars) expect(await bar.evaluate(fits)).toBe(true)
  })

  test('los compases partidos caben a 320 px', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Ajustes' }).click()
    await page.getByRole('radio', { name: 'Progresión' }).click()
    await page
      .getByRole('combobox', { name: 'Progresión' })
      .selectOption({ label: 'Coltrane (Giant Steps, avanzado)' })
    await page.getByRole('radio', { name: 'Fa sostenido' }).click()
    await page.getByRole('radio', { name: 'Bajo + acorde' }).click()
    await page.getByRole('button', { name: 'Cerrar' }).click()

    await page.getByRole('button', { name: 'Play' }).click()
    const parts = page
      .getByRole('list', { name: 'Carril' })
      .locator('[data-at]')
    // Giant Steps: tres compases partidos y uno entero
    await expect(parts).toHaveCount(7)
    for (const part of await parts.all()) {
      expect(await part.evaluate(fits)).toBe(true)
    }
    const hasHorizontalScroll = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth
    )
    expect(hasHorizontalScroll).toBe(false)
  })
})

function fits(element: Element) {
  return element.scrollWidth <= element.clientWidth
}
