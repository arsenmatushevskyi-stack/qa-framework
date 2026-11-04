import { expect, test } from '@playwright/test';
import { runIfEnv } from '../../env/runIfEnv.ts';
import { loginViaUi } from '../support/auth.ts';
import { AUTHOR } from '../support/users.ts';

test.describe('Blog categories smoke', () => {
  runIfEnv(test, ['dev']);

  test('signed-in author sees the category list with an item', async ({ page }) => {
    await loginViaUi(page, AUTHOR);
    await page.goto('/categories');

    const list = page.getByTestId('category-list');
    await expect(list).toBeVisible();
    await expect(list.getByTestId('category-item').first()).toBeVisible();
  });
});
