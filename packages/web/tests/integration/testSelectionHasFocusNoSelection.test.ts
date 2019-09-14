import { pageDom, pageGoto, pageKeyboard } from './helpers';

beforeEach(async () => {
  await pageGoto('testSelectionHasFocusNoSelection');
});

test('render then key arrow right', async () => {
  await expect(await pageDom()).toMatchSnapshot();

  await pageKeyboard.press('ArrowRight');
  await expect(await pageDom()).toMatchSnapshot();
});
