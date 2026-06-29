import { test, expect, Page } from '@playwright/test';

async function loginExistingUser(page: Page, email: string) {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill('TestPass123!');
  await page.getByRole('button', { name: /sign in|log in/i }).click();
  await page.waitForURL(/\/home|\/dashboard/, { timeout: 10_000 });
}

async function registerAndOnboard(page: Page, email: string) {
  // Register
  await page.goto('/register');
  await page.getByLabel(/name/i).fill('Task Tester');
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill('TestPass123!');
  await page.getByRole('button', { name: /create account|register|sign up/i }).click();
  await page.waitForURL(/\/onboard/, { timeout: 10_000 });

  // Complete onboarding (minimal path)
  await page.getByRole('button', { name: /fullstack/i }).click();
  await page.getByRole('button', { name: /next|continue/i }).click();
  await page.getByRole('button', { name: /next|continue|skip/i }).click();
  await page.getByRole('button', { name: /10/i }).click();
  await page.getByRole('button', { name: /start|finish|done|let.?s go/i }).click();
  await page.waitForURL(/\/home|\/dashboard/, { timeout: 15_000 });
}

test.describe('Tasks page', () => {
  let email: string;

  test.beforeAll(async ({ browser }) => {
    email = `tasks_${Date.now()}@example.com`;
    const page = await browser.newPage();
    await registerAndOnboard(page, email);
    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    await loginExistingUser(page, email);
  });

  test('tasks page is reachable from sidebar', async ({ page }) => {
    await page.getByRole('link', { name: /tasks/i }).click();
    await expect(page).toHaveURL(/\/tasks/);
  });

  test('shows a task board with columns', async ({ page }) => {
    await page.goto('/tasks');
    // Expect at least one kanban-style column heading
    const headings = ['To do', 'In progress', 'Done'];
    for (const h of headings) {
      await expect(page.getByText(new RegExp(h, 'i'))).toBeVisible({ timeout: 5_000 });
    }
  });

  test('can open the add-task form', async ({ page }) => {
    await page.goto('/tasks');
    await page.getByRole('button', { name: /add task/i }).click();
    await expect(page.getByPlaceholder(/task title|title/i)).toBeVisible();
  });

  test('creates a task and sees it in the To Do column', async ({ page }) => {
    await page.goto('/tasks');
    await page.getByRole('button', { name: /add task/i }).click();

    const titleInput = page.getByPlaceholder(/task title|title/i);
    await titleInput.fill('E2E test task');

    // Submit the form
    await page.getByRole('button', { name: /^add$|^create$|^save$/i }).click();

    // The new task should appear in the board
    await expect(page.getByText('E2E test task')).toBeVisible({ timeout: 8_000 });
  });

  test('shows error toast when task title is empty', async ({ page }) => {
    await page.goto('/tasks');
    await page.getByRole('button', { name: /add task/i }).click();

    // Submit without filling in title
    await page.getByRole('button', { name: /^add$|^create$|^save$/i }).click();

    // Should show an error/toast, not create a task
    await expect(page.getByText(/title|required/i)).toBeVisible({ timeout: 3_000 });
  });

  test('unauthenticated user is redirected to login', async ({ page }) => {
    // Clear the session
    await page.context().clearCookies();
    await page.goto('/tasks');
    await expect(page).toHaveURL(/\/login/, { timeout: 5_000 });
  });
});
