import { pageDom, pageGoto } from './helpers';

beforeEach(async () => {
  await pageGoto('testSetState');
});

test('select', async () => {
  await expect(await pageDom()).toMatchSnapshot();
});
