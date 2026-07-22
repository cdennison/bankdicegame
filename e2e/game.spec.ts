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

const assertFinalScore = async (
  page: Page,
  rankings: ReturnType<Page['getByRole']>,
  playerName: string,
  score: number,
) => {
  const row = rankings.getByRole('listitem').filter({
    has: page.getByText(playerName, { exact: true }),
  });
  await expect(row).toHaveCount(1);
  await expect(row.getByText(String(score), { exact: true })).toBeVisible();
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
  const speedMode = page.getByRole('button', { name: 'Speed Mode Off' });
  await expect(speedMode).toHaveAttribute('aria-pressed', 'false');
  await speedMode.click();
  await expect(page.getByRole('button', { name: 'Speed Mode On' })).toHaveAttribute('aria-pressed', 'true');
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

    if (round < 10) {
      const startNextRound = page.getByRole('button', { name: `Start Round #${round + 1}`, exact: true });
      await expect(startNextRound).toBeVisible({ timeout: 60_000 });
      await expect(match.locator('.dice-pair')).toHaveAttribute('aria-label', /^Dice: [1-6] and [1-6]$/);
      await startNextRound.click();
      await expect(page.getByText(`Round ${round + 1} / 10`, { exact: true })).toBeVisible();
    }
  }

  await expect(page.getByRole('heading', { name: 'Mira wins!' })).toBeVisible({ timeout: 60_000 });
  const rankings = page.getByRole('list', { name: 'Final rankings' });
  await assertFinalScore(page, rankings, 'Mira', 780);
  await assertFinalScore(page, rankings, 'You', 458);
  await assertFinalScore(page, rankings, 'Vega', 360);

  const reveals = page.getByRole('region', { name: 'Opponent strategies revealed' });
  const miraReveal = reveals.getByRole('article').filter({
    has: page.getByText('Mira', { exact: true }),
  });
  const vegaReveal = reveals.getByRole('article').filter({
    has: page.getByText('Vega', { exact: true }),
  });
  await expect(miraReveal).toHaveCount(1);
  await expect(vegaReveal).toHaveCount(1);
  await expect(miraReveal.getByRole('heading', { name: 'State Delta' })).toBeVisible();
  await expect(vegaReveal.getByRole('heading', { name: 'Fixed 200' })).toBeVisible();
  await expect(page.getByText(challengeCode, { exact: true })).toBeVisible();

  await assertViewportHasNoHorizontalOverflow(page);
});
