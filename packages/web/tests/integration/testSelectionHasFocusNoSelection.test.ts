import { pageUrl } from './helpers/pageUrl';
import { pageDom } from './helpers/pageDom';

beforeEach(async () => {
  await page.goto(pageUrl('testSelectionHasFocusNoSelection'));
  await page.waitFor(50);
});

test('render then key arrow right', async () => {
  await expect(await pageDom()).toMatchSnapshot();

  await page.keyboard.press('ArrowRight');
  await page.waitFor(50);
  await expect(await pageDom()).toMatchSnapshot();
});
