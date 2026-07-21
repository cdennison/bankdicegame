import { expect, test, type Page } from '@playwright/test';

const challengeCode = 'BK1-AAKD-JXV2';

const assertViewportHasNoHorizontalOverflow = async (page: Page) => {
  const widths = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));

  expect(widths.document).toBe(widths.viewport);
  expect(widths.body).toBe(widths.viewport);
};

test('replays the complete seeded game through public controls', async ({ page }, testInfo) => {
  await page.goto('/game/');

  await expect(page.getByRole('heading', { name: 'Choose your opponents' })).toBeVisible();
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
  await page.getByRole('textbox', { name: 'Challenge code' }).fill(challengeCode);
  await page.getByRole('button', { name: 'Select Mira' }).click();
  await page.getByRole('button', { name: 'Select Vega' }).click();
  await page.getByRole('button', { name: 'Start', exact: true }).click();

  const match = page.getByRole('region', { name: 'Bank It match' });
  const actionDock = page.getByRole('region', { name: 'Match actions' });
  await expect(match).toBeVisible();
  await expect(actionDock).toBeVisible();
  if (testInfo.project.name === 'desktop') {
    await expect(actionDock).toBeInViewport();
  }

  await assertViewportHasNoHorizontalOverflow(page);

  for (let round = 1; round <= 10; round += 1) {
    await expect(page.getByText(`Round ${round} / 10`, { exact: true })).toBeVisible({ timeout: 60_000 });

    const bank = page.getByRole('button', { name: 'Bank', exact: true });
    const roll = page.getByRole('button', { name: 'Roll', exact: true });
    await expect(async () => {
      if (await bank.isVisible()) return;
      if (await roll.isVisible()) await roll.click();
      throw new Error(`Waiting for a public human action in round ${round}`);
    }).toPass({ timeout: 60_000 });
    await bank.click();
  }

  await expect(page.getByRole('heading', { name: 'Mira wins!' })).toBeVisible({ timeout: 60_000 });
  const rankings = page.getByRole('list', { name: 'Final rankings' });
  await expect(rankings.getByRole('listitem').filter({ hasText: 'Mira' })).toContainText('780');
  await expect(rankings.getByRole('listitem').filter({ hasText: 'You' })).toContainText('458');
  await expect(rankings.getByRole('listitem').filter({ hasText: 'Vega' })).toContainText('360');
  await expect(page.getByRole('heading', { name: 'State Delta' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Fixed 200' })).toBeVisible();
  await expect(page.getByText(challengeCode, { exact: true })).toBeVisible();

  await assertViewportHasNoHorizontalOverflow(page);
});
