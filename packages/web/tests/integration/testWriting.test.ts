import { pageDom, pageGoto, pageKeyboard } from './helpers';

beforeEach(async () => {
  await pageGoto('testWriting');
});

test('insert text at end', async () => {
  await pageKeyboard.press('ArrowRight');
  await pageKeyboard.press('h');
  await pageKeyboard.press('o');
  await pageKeyboard.press('j');
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
  await pageKeyboard.press('ArrowRight');
  await pageKeyboard.press('Backspace');
  await pageKeyboard.press('b');
  await pageKeyboard.press('Backspace');
  await expect(await pageDom()).toMatchSnapshot();
});
