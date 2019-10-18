import { pageDom, pageGoto } from './helpers';

beforeEach(async () => {
  await pageGoto('testSetState');
});

test('operations', async () => {
  // TODO: We should register testSetState callback somehow.
  await page.waitFor(500);
  await expect(await pageDom()).toMatchSnapshot();
});
