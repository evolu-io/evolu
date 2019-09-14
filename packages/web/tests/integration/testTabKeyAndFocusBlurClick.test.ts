import { pageDom, pageGoto, pageClick, pageKeyboard } from './helpers';

beforeEach(async () => {
  await pageGoto('testTabKeyAndFocusBlurClick');
});

test('render', async () => {
  await expect(await pageDom()).toMatchSnapshot();
});

test('focus blur via tab, tab, tab', async () => {
  await pageKeyboard.press('Tab');
  await expect(await pageDom()).toMatchSnapshot();

  await pageKeyboard.press('Tab');
  await expect(await pageDom()).toMatchSnapshot();

  await pageKeyboard.press('Tab');
  await expect(await pageDom()).toMatchSnapshot();
});

test('click to focus button, click to blur button', async () => {
  await pageClick('button.focus');
  await expect(await pageDom()).toMatchSnapshot();

  await pageClick('button.blur');
  await expect(await pageDom()).toMatchSnapshot();
});
