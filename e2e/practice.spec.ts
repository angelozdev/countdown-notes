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
