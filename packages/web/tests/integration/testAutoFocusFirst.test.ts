import { pageDom, pageGoto } from './helpers';

beforeEach(async () => {
  page.on('dialog', async dialog => {
    await dialog.dismiss();
  });
  await pageGoto('testAutoFocusFirst');
});

test('render', async () => {
  await expect(await pageDom()).toMatchSnapshot();
  // TODO: Figure out how to test focus is not lost on alert.
  // Manual test for now:
  // Open http://localhost:3000/testAutoFocusFirst, close alert,
  // check if editor still has a focus.
});
