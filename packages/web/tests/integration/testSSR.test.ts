// import snapshotDiff from 'snapshot-diff';
import { pageDom, pageUrl, pageAwaitFor50ms } from './helpers';

// emotion changed SSR so it renders different HTML on dev and production.
// TODO: Reenable disabled tests once we figure out how to "fix" it. We
// need `yarn jest` for dev

// test('dom before JS is executed', async () => {
//   await page.goto(pageUrl('testSSR'), { waitUntil: 'domcontentloaded' });
//   await expect(await pageDom()).toMatchSnapshot();
// });

test('dom after JS is executed', async () => {
  await page.goto(pageUrl('testSSR'));
  await pageAwaitFor50ms();
  await expect(await pageDom()).toMatchSnapshot();
});

// test('dom diff before and after JS is executed', async () => {
//   await page.goto(pageUrl('testSSR'), { waitUntil: 'domcontentloaded' });
//   const before = await pageDom();
//   await page.goto(pageUrl('testSSR'));
//   await pageAwaitFor50ms();
//   const after = await pageDom();
//   await expect(snapshotDiff(before, after)).toMatchSnapshot();
// });
