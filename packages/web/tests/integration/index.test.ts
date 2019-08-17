import { serializeDom } from './helpers/serializeDom';

beforeEach(async () => {
  await page.goto(`file://${__dirname}/out/index.html`, {
    waitUntil: 'networkidle2',
  });
  await page.waitFor(100);
});

test('page title', async () => {
  await expect(page.title()).resolves.toMatch('Slad');
});

test('render', async () => {
  await expect(await page.evaluate(serializeDom)).toMatchSnapshot();
});

test('focus blur via tab, tab, tab', async () => {
  await page.keyboard.press('Tab', { delay: 100 });
  await page.waitFor(100);
  await expect(await page.evaluate(serializeDom)).toMatchSnapshot();

  await page.keyboard.press('Tab', { delay: 100 });
  await page.waitFor(100);
  await expect(await page.evaluate(serializeDom)).toMatchSnapshot();

  await page.keyboard.press('Tab', { delay: 100 });
  await page.waitFor(100);
  await expect(await page.evaluate(serializeDom)).toMatchSnapshot();
});

// https://github.com/steida/slad/issues/14
export default undefined;
