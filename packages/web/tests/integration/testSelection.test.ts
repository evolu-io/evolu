import { pageDom, pageGoto, pageClick, pageKeyboard } from './helpers';

beforeEach(async () => {
  await pageGoto('testSelection');
});

test('select', async () => {
  await expect(await pageDom()).toMatchSnapshot();

  await pageClick('.select-first-two-letters');
  await expect(await pageDom()).toMatchSnapshot();

  await pageClick('.select-first-two-letters-backward');
  await expect(await pageDom()).toMatchSnapshot();

  await pageKeyboard.down('Shift');
  await pageKeyboard.press('ArrowRight');
  await pageKeyboard.up('Shift');

  await expect(await pageDom()).toMatchSnapshot();

  await pageClick('.select-all');
  await expect(await pageDom()).toMatchSnapshot();

  await pageClick('.select-all-backward');
  await expect(await pageDom()).toMatchSnapshot();

  // TODO: Once we decide what we want.
  // await pageClick('.unselect');
  // await expect(await pageDom()).toMatchSnapshot();
});
