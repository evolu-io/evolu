beforeAll(async () => {
  await page.goto('https://google.com');
});

test('page title is "Google"', async () => {
  await expect(page.title()).resolves.toMatch('Google');
});

// https://github.com/steida/slad/issues/14
export default undefined;
