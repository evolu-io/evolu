import { pageUrl } from './helpers/pageUrl';
import { pageDom } from './helpers/pageDom';

beforeEach(async () => {
  await page.goto(pageUrl('testAutoFocusSecond'));
  await page.waitFor(50);
});

test('render', async () => {
  await expect(await pageDom()).toMatchSnapshot();
});

// https://github.com/steida/slad/issues/14
export default undefined;
