import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('shows login page and authenticates demo owner', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()

    await page.getByLabel(/email/i).fill('owner@saru.demo')
    await page.getByLabel(/password/i).fill('Demo@1234')
    await page.getByRole('button', { name: /sign in/i }).click()

    await expect(page).toHaveURL(/dashboard/)
    await expect(page.getByRole('heading', { name: /operations dashboard/i })).toBeVisible({
      timeout: 15_000,
    })
  })

  test('rejects invalid credentials', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/email/i).fill('owner@saru.demo')
    await page.getByLabel(/password/i).fill('WrongPassword')
    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(page.getByText(/invalid|incorrect|failed/i).first()).toBeVisible({
      timeout: 10_000,
    })
  })
})
