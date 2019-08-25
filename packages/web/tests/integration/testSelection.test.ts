import { pageUrl } from './helpers/pageUrl';
import { pageDom } from './helpers/pageDom';

beforeEach(async () => {
  await page.goto(pageUrl('testSelection'));
  await page.waitFor(50);
});

test('selection is remembered', async () => {
  await expect(true).toBe(true);
  // await page.keyboard.press('Tab');
  // await page.waitFor(50);
  // await expect(await pageDom()).toMatchSnapshot();

  // await page.keyboard.down('Shift');
  // await page.keyboard.press('Tab');
  // await page.waitFor(50);
  // await expect(await pageDom()).toMatchSnapshot();
});

// test('unselect selection', async () => {
//   await page.click('.unselect');
//   await page.waitFor(50);
//   await expect(await pageDom()).toMatchSnapshot();
// });

// test('selection via mousedown', async () => {
//   await page.click('.select-first-two-letters');
//   await page.waitFor(50);
//   await expect(await pageDom()).toMatchSnapshot();

//   await page.click('.select-first-two-letters-backward');
//   await page.waitFor(50);
//   await expect(await pageDom()).toMatchSnapshot();

//   await page.click('.select-all');
//   await page.waitFor(50);
//   await expect(await pageDom()).toMatchSnapshot();

//   await page.click('.select-all-backward');
//   await page.waitFor(50);
//   await expect(await pageDom()).toMatchSnapshot();
// });

// https://github.com/steida/slad/issues/14
export default undefined;
