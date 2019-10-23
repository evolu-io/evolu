import { pageDom, pageGoto } from './helpers';

beforeEach(async () => {
  await pageGoto('testSetValue');
});

test('operations', async () => {
  await page.waitFor(2000);
  await expect(await pageDom()).toMatchSnapshot();
});
