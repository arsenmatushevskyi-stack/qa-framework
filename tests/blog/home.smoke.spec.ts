import { expect, test } from '@playwright/test';
import { runIfEnv } from '../../env/runIfEnv.ts';

test.describe('Blog home smoke', () => {
  runIfEnv(test, ['dev']);

  test('banner identifies the development site', async ({ page }) => {
    await page.goto('/');

    const banner = page.getByTestId('env-banner');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText('DEVELOPMENT');
  });

  test('article list shows at least one article card', async ({ page }) => {
    await page.goto('/');

    const cards = page.getByTestId('article-list').getByTestId('article-item');
    await expect(cards.first()).toBeVisible();
    await expect(cards).not.toHaveCount(0);
  });
});
