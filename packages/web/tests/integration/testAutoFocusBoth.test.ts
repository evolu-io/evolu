import { pageDom, pageGoto } from './helpers';

beforeEach(async () => {
  await pageGoto('testAutoFocusBoth');
});

test('render', async () => {
  await expect(await pageDom()).toMatchSnapshot();
});
