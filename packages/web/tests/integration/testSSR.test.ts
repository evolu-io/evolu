import snapshotDiff from 'snapshot-diff';

import { pageDom, pageUrl } from './helpers';

test('dom before JS is executed', async () => {
  await page.goto(pageUrl('testSSR'), { waitUntil: 'domcontentloaded' });
  await expect(await pageDom()).toMatchSnapshot();
});

test('dom after JS is executed', async () => {
  await page.goto(pageUrl('testSSR'));
  await expect(await pageDom()).toMatchSnapshot();
});

test('dom diff before and after JS is executed', async () => {
  await page.goto(pageUrl('testSSR'), { waitUntil: 'domcontentloaded' });
  const before = await pageDom();
  await page.goto(pageUrl('testSSR'));
  const after = await pageDom();
  await expect(snapshotDiff(before, after)).toMatchSnapshot();
});
