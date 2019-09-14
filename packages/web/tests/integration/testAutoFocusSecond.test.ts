import { pageDom, pageGoto } from './helpers';

beforeEach(async () => {
  await pageGoto('testAutoFocusSecond');
});

test('render', async () => {
  await expect(await pageDom()).toMatchSnapshot();
});
