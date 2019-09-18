import { pageDom, pageGoto } from './helpers';

beforeEach(async () => {
  await pageGoto('testEditorServer');
});

test('render', async () => {
  await expect(await pageDom()).toMatchSnapshot();
});
