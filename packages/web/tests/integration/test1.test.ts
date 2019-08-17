import { serializeDom } from './helpers/serializeDom';

beforeEach(async () => {
  await page.goto(`file://${__dirname}/out/test1.html`);
  await page.waitFor(50);
});

test('render', async () => {
  await expect(await page.evaluate(serializeDom)).toMatchSnapshot();
});

// https://github.com/steida/slad/issues/14
export default undefined;
