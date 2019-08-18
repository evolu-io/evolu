import { pageDom } from './helpers/pageDom';

beforeEach(async () => {
  await page.goto(`file://${__dirname}/out/test2.html`);
  await page.waitFor(50);
});

test('render', async () => {
  await expect(await pageDom()).toMatchSnapshot();
});

// https://github.com/steida/slad/issues/14
export default undefined;
