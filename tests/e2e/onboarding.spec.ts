import { test, expect, Page } from '@playwright/test';

// Each test run registers a fresh user to avoid conflicts
async function registerUser(page: Page, email: string) {
  await page.goto('/register');
  await page.getByLabel(/name/i).fill('Onboard Tester');
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill('TestPass123!');
  await page.getByRole('button', { name: /create account|register|sign up/i }).click();
  await page.waitForURL(/\/onboard/, { timeout: 10_000 });
}

test.describe('Onboarding flow', () => {
  test.beforeEach(async ({ page }) => {
    const email = `onboard_${Date.now()}@example.com`;
    await registerUser(page, email);
  });

  test('shows three onboarding steps', async ({ page }) => {
    // Step 1 — role picker
    await expect(page.getByText(/what do you want to become/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /fullstack|backend|frontend|devops|data|mobile/i }).first()).toBeVisible();
  });

  test('advances to step 2 after selecting a role', async ({ page }) => {
    await page.getByRole('button', { name: /fullstack/i }).click();
    await page.getByRole('button', { name: /next|continue/i }).click();

    // Step 2 — known skills
    await expect(page.getByText(/skills|what do you already know/i)).toBeVisible({ timeout: 5_000 });
  });

  test('completes full 3-step onboarding and lands on dashboard', async ({ page }) => {
    // Step 1 — pick role
    await page.getByRole('button', { name: /fullstack/i }).click();
    await page.getByRole('button', { name: /next|continue/i }).click();

    // Step 2 — select a skill (optional, just click next)
    await page.getByRole('button', { name: /next|continue|skip/i }).click();

    // Step 3 — weekly hours
    await expect(page.getByText(/hours|week/i)).toBeVisible({ timeout: 5_000 });
    await page.getByRole('button', { name: /10/i }).click();
    await page.getByRole('button', { name: /start|finish|done|let.?s go/i }).click();

    // Should land on home/dashboard after onboarding
    await expect(page).toHaveURL(/\/home|\/dashboard/, { timeout: 15_000 });
  });

  test('cannot skip onboarding by navigating directly to /home', async ({ page }) => {
    // While on /onboard, try navigating to /home directly
    await page.goto('/home');
    // Should be redirected back to /onboard
    await expect(page).toHaveURL(/\/onboard/);
  });
});
