import { expect, test } from '@playwright/test';

test('keeps landing interactions working in the production build', async ({ page }, testInfo) => {
  await page.goto('/');

  if (testInfo.project.name === 'mobile') {
    const menuToggle = page.locator('button[aria-controls="site-nav"]');
    await expect(menuToggle).toHaveAccessibleName('Open navigation');
    await menuToggle.click();
    await expect(menuToggle).toHaveAccessibleName('Close navigation');
    await expect(menuToggle).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByRole('navigation', { name: 'Primary navigation' })).toHaveClass(/open/);
    await page.keyboard.press('Escape');
    await expect(menuToggle).toHaveAttribute('aria-expanded', 'false');
  }

  await page.getByRole('button', { name: /Bank 184/ }).click();
  await expect(page.getByText('Strategy unlocked')).toBeVisible();
  await expect(page.getByText(/You banked the 184 points/)).toBeVisible();
});
