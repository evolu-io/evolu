import { pageDom, pageGoto } from './helpers';

beforeEach(async () => {
  await pageGoto('testSetValue');
});

test('operations', async () => {
  // TODO: We should register testSetValue callback somehow.
  await page.waitFor(500);
  await expect(await pageDom()).toMatchSnapshot();
});
