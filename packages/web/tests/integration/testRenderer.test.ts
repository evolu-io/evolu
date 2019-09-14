import { pageDom, pageGoto } from './helpers';

beforeEach(async () => {
  await pageGoto('testRenderer');
});

test('render', async () => {
  await expect(await pageDom()).toMatchSnapshot();
});
