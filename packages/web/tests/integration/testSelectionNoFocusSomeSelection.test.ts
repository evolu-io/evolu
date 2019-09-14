import { pageDom, pageGoto, pageKeyboard } from './helpers';

beforeEach(async () => {
  await pageGoto('testSelectionNoFocusSomeSelection');
});

test('render then tab then key arrow right', async () => {
  await expect(await pageDom()).toMatchSnapshot();

  await pageKeyboard.press('Tab');
  await expect(await pageDom()).toMatchSnapshot();

  await pageKeyboard.press('ArrowRight');
  await expect(await pageDom()).toMatchSnapshot();
});
