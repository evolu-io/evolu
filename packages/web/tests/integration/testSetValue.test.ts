import { pageDom, pageGoto } from './helpers';

beforeEach(async () => {
  await pageGoto('testSetValue');
});

test('operations', async () => {
  await page.waitFor(1000);
  await expect(await pageDom()).toMatchSnapshot();
});
