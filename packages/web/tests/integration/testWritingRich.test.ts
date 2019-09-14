import { pageDom, pressMany, pageGoto, pageKeyboard } from './helpers';

beforeEach(async () => {
  await pageGoto('testWritingRich');
});

test('insert text at end', async () => {
  await pressMany('ArrowRight', 7);
  await pageKeyboard.press('.');
  await pageKeyboard.press(' ');
  await expect(await pageDom()).toMatchSnapshot();
});

test('insert text at start then middle', async () => {
  await pageKeyboard.press('b');
  await pageKeyboard.press('l');
  await expect(await pageDom()).toMatchSnapshot();
});

test('remove text', async () => {
  await pageKeyboard.press('b');
  await pageKeyboard.press('Backspace');
  await pressMany('ArrowRight', 7);
  await pressMany('Backspace', 7);
  await pageKeyboard.press('ArrowDown');
  await pageKeyboard.press('ArrowUp');
  await pageKeyboard.press('a');
  await pageKeyboard.press('b');
  await expect(await pageDom()).toMatchSnapshot();
});
