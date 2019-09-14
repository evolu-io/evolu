import { pageDom, pageGoto, pageKeyboard } from './helpers';

beforeEach(async () => {
  await pageGoto('testSelectionNoFocusNoSelection');
});

test('tab then key arrow right', async () => {
  await pageKeyboard.press('Tab');
  await expect(await pageDom()).toMatchSnapshot();

  await pageKeyboard.press('ArrowRight');
  await expect(await pageDom()).toMatchSnapshot();
});
