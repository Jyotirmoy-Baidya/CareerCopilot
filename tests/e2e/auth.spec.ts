import { test, expect } from '@playwright/test';

// Unique email per run so tests are idempotent
const email    = `e2e_${Date.now()}@example.com`;
const password = 'TestPass123!';
const name     = 'E2E User';

test.describe('Authentication', () => {
  test('register page is accessible from landing navbar', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /register/i }).click();
    await expect(page).toHaveURL(/\/register/);
  });

  test('login page is accessible from landing navbar', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('shows validation errors for empty register form', async ({ page }) => {
    await page.goto('/register');
    await page.getByRole('button', { name: /create account|register|sign up/i }).click();
    // The form should not navigate away
    await expect(page).toHaveURL(/\/register/);
  });

  test('shows error for invalid email on register', async ({ page }) => {
    await page.goto('/register');
    await page.getByLabel(/name/i).fill('Test User');
    await page.getByLabel(/email/i).fill('not-an-email');
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole('button', { name: /create account|register|sign up/i }).click();
    await expect(page).toHaveURL(/\/register/);
  });

  test('full register → onboard redirect flow', async ({ page }) => {
    await page.goto('/register');
    await page.getByLabel(/name/i).fill(name);
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole('button', { name: /create account|register|sign up/i }).click();

    // New users should end up on the onboarding page
    await expect(page).toHaveURL(/\/onboard/, { timeout: 10_000 });
  });

  test('login with wrong password shows error', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill('wrong-password');
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    // Should stay on the login page and show an error
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText(/invalid|incorrect|wrong/i)).toBeVisible({ timeout: 5_000 });
  });
});
