import { pageDom } from './helpers/pageDom';

beforeEach(async () => {
  await page.goto(`file://${__dirname}/out/index.html`);
  await page.waitFor(50);
});

test('page title', async () => {
  await expect(page.title()).resolves.toMatch('Slad');
});

test('render', async () => {
  await expect(await pageDom()).toMatchSnapshot();
});

test('focus blur via tab, tab, tab, click to focus button, click to blur button', async () => {
  await page.keyboard.press('Tab');
  await page.waitFor(50);
  await expect(await pageDom()).toMatchSnapshot();

  await page.keyboard.press('Tab');
  await page.waitFor(50);
  await expect(await pageDom()).toMatchSnapshot();

  await page.keyboard.press('Tab');
  await page.waitFor(50);
  await expect(await pageDom()).toMatchSnapshot();

  await page.click('button.focus');
  await page.waitFor(50);
  await expect(await pageDom()).toMatchSnapshot();

  await page.click('button.blur');
  await page.waitFor(50);
  await expect(await pageDom()).toMatchSnapshot();
});

// https://github.com/steida/slad/issues/14
export default undefined;