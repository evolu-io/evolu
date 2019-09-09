import { pageUrl } from './helpers/pageUrl';
import { pageDom } from './helpers/pageDom';
import { pressMany } from './helpers/keyboard';

beforeEach(async () => {
  await page.goto(pageUrl('testWritingRich'));
  await page.waitFor(50);
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
  await expect(await pageDom()).toMatchSnapshot();
});
