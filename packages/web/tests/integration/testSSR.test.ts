import { pageDom, pageUrl } from './helpers';

test('render before JavaScript is executed', async () => {
  await page.goto(pageUrl('testSSR'), { waitUntil: 'domcontentloaded' });
  await expect(await pageDom()).toMatchSnapshot();
});

test('render after JavaScript is executed', async () => {
  await page.goto(pageUrl('testSSR'));
  await expect(await pageDom()).toMatchSnapshot();
});

// TODO: Compare HTML content before and after after switch to Emotion.
