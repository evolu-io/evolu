import { serializeDom } from './helpers/serializeDom';

beforeEach(async () => {
  await page.goto(`file://${__dirname}/out/index.html`);
});

// pak tab, tab, tab, pak focus first, focus second, focus both

test('page title', async () => {
  await expect(page.title()).resolves.toMatch('Slad');
});

test('initial render', async () => {
  await expect(await page.evaluate(serializeDom)).toMatchSnapshot();
});

test('focus blur via tab, tab, tab', async () => {
  await page.keyboard.press('Tab', { delay: 10 });
  await expect(await page.evaluate(serializeDom)).toMatchSnapshot();

  await page.keyboard.press('Tab', { delay: 10 });
  await expect(await page.evaluate(serializeDom)).toMatchSnapshot();

  await page.keyboard.press('Tab', { delay: 10 });
  await expect(await page.evaluate(serializeDom)).toMatchSnapshot();
});

// https://github.com/steida/slad/issues/14
export default undefined;
