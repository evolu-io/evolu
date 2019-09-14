import { pageDom, pageGoto } from './helpers';

beforeEach(async () => {
  await pageGoto('testTabKeyAndFocusBlurClick');
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

  await page.click('button.blur');
  await page.waitFor(50);
  await expect(await pageDom()).toMatchSnapshot();
});
