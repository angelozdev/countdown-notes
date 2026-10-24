import { expect, test } from '@playwright/test'

test('abre la pantalla base', async ({ page }) => {
  await page.goto('/')
  await expect(
    page.getByRole('heading', { level: 1, name: 'Countdown Notes' })
  ).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('lang', 'es')
  const hasHorizontalScroll = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth
  )
  expect(hasHorizontalScroll).toBe(false)
})
