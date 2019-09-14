import { pageDom, pageGoto } from './helpers';

beforeEach(async () => {
  await pageGoto('testNormalizeEditorElement');
});

test('render', async () => {
  await expect(await pageDom()).toMatchSnapshot();
});
