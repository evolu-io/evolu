import { pageDom, pageGoto } from './helpers';

beforeEach(async () => {
  await pageGoto('testSetValue');
});

test('operations', async () => {
  await page.waitForSelector('#done');
  await expect(await pageDom()).toMatchSnapshot();
});
