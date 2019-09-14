import { pageDom, pressMany, pageGoto } from './helpers';

beforeEach(async () => {
  await pageGoto('testWritingRich');
});

test('insert text at end', async () => {
  await pressMany('ArrowRight', 7);
  await page.waitFor(50);
  await page.keyboard.press('.');
  await page.waitFor(50);
  await page.keyboard.press(' ');
  await page.waitFor(50);
  await expect(await pageDom()).toMatchSnapshot();
});

test('insert text at start then middle', async () => {
  await page.keyboard.press('b');
  await page.waitFor(50);
  await page.keyboard.press('l');
  await page.waitFor(50);
  await expect(await pageDom()).toMatchSnapshot();
});

test('remove text', async () => {
  await page.keyboard.press('b');
  await page.waitFor(50);
  await page.keyboard.press('Backspace');
  await page.waitFor(50);
  await pressMany('ArrowRight', 7);
  await page.waitFor(50);
  await pressMany('Backspace', 7);
  await page.waitFor(50);
  await page.keyboard.press('ArrowDown');
  await page.waitFor(50);
  await page.keyboard.press('ArrowUp');
  await page.waitFor(50);
  await page.keyboard.press('a');
  await page.waitFor(50);
  await page.keyboard.press('b');
  await page.waitFor(50);
  await expect(await pageDom()).toMatchSnapshot();
});
