import { serializeDom } from './helpers/serializeDom';

beforeEach(async () => {
  await page.goto(`file://${__dirname}/out/test2.html`, {
    waitUntil: 'networkidle2',
  });
  await page.waitFor(100);
});

test('render', async () => {
  await expect(await page.evaluate(serializeDom)).toMatchSnapshot();
});

// https://github.com/steida/slad/issues/14
export default undefined;
