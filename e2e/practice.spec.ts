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
