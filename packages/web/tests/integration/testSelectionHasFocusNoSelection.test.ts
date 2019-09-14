import { pageDom, pageGoto } from './helpers';

beforeEach(async () => {
  await pageGoto('testSelectionHasFocusNoSelection');
});

test('render then key arrow right', async () => {
  await expect(await pageDom()).toMatchSnapshot();

  await page.keyboard.press('ArrowRight');
  await page.waitFor(50);
  await expect(await pageDom()).toMatchSnapshot();
});
