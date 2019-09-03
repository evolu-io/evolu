import { pageUrl } from './helpers/pageUrl';
import { pageDom } from './helpers/pageDom';

beforeEach(async () => {
  await page.goto(pageUrl('testRenderReactDOMElement'));
});

test('render', async () => {
  await expect(await pageDom()).toMatchSnapshot();
});
