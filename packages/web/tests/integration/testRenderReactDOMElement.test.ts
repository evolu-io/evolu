import { pageDom, pageGoto } from './helpers';

beforeEach(async () => {
  await pageGoto('testRenderReactDOMElement');
});

test('render', async () => {
  await expect(await pageDom()).toMatchSnapshot();
});
