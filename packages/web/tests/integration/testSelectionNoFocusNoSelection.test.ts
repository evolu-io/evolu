import { pageUrl } from './helpers/pageUrl';
import { pageDom } from './helpers/pageDom';

beforeEach(async () => {
  await page.goto(pageUrl('testSelectionNoFocusNoSelection'));
  await page.waitFor(50);
});

test('tab then key arrow right', async () => {
  await page.keyboard.press('Tab');
  await page.waitFor(50);
  await expect(await pageDom()).toMatchSnapshot();

  await page.keyboard.press('ArrowRight');
  await page.waitFor(50);
  await expect(await pageDom()).toMatchSnapshot();
});
