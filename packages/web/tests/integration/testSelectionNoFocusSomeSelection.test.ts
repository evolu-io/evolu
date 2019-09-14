import { pageDom, pageGoto } from './helpers';

beforeEach(async () => {
  await pageGoto('testSelectionNoFocusSomeSelection');
});

test('render then tab then key arrow right', async () => {
  await expect(await pageDom()).toMatchSnapshot();

  await page.keyboard.press('Tab');
  await page.waitFor(50);
  await expect(await pageDom()).toMatchSnapshot();

  await page.keyboard.press('ArrowRight');
  await page.waitFor(50);
  await expect(await pageDom()).toMatchSnapshot();
});
