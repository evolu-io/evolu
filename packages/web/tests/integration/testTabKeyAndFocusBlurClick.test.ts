import { pageUrl } from './helpers/pageUrl';
import { pageDom } from './helpers/pageDom';

beforeEach(async () => {
  await page.goto(pageUrl('testTabKeyAndFocusBlurClick'));
  await page.waitFor(50);
});

test('render', async () => {
  await expect(await pageDom()).toMatchSnapshot();
});

test('focus blur via tab, tab, tab', async () => {
  await page.keyboard.press('Tab');
  await page.waitFor(50);
  await expect(await pageDom()).toMatchSnapshot();

  await page.keyboard.press('Tab');
  await page.waitFor(50);
  await expect(await pageDom()).toMatchSnapshot();

  await page.keyboard.press('Tab');
  await page.waitFor(50);
  await expect(await pageDom()).toMatchSnapshot();
});

test('click to focus button, click to blur button', async () => {
  await page.click('button.focus');
  await page.waitFor(50);
  await expect(await pageDom()).toMatchSnapshot();

  // Editor div.blur() has a race condition. Check Editor.tsx.
  // await page.click('button.blur');
  // await page.waitFor(50);
  // await expect(await pageDom()).toMatchSnapshot();
});

// https://github.com/steida/slad/issues/14
export default undefined;
