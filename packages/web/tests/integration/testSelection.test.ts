import { pageUrl } from './helpers/pageUrl';
import { pageDom } from './helpers/pageDom';

beforeEach(async () => {
  await page.goto(pageUrl('testSelection'));
  await page.waitFor(50);
});

test('selection', async () => {
  await page.click('.select-first-two-letters');
  await page.waitFor(50);
  await expect(await pageDom()).toMatchSnapshot();

  await page.click('.select-first-two-letters-backward');
  await page.waitFor(50);
  await expect(await pageDom()).toMatchSnapshot();

  await page.click('.select-all');
  await page.waitFor(50);
  await expect(await pageDom()).toMatchSnapshot();

  await page.click('.select-all-backward');
  await page.waitFor(50);
  await expect(await pageDom()).toMatchSnapshot();
});

// https://github.com/steida/slad/issues/14
export default undefined;
