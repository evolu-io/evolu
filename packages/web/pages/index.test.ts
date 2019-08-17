beforeAll(async () => {
  await page.goto('http://localhost:3000/');
});

test('page title is "Slad"', async () => {
  await expect(page.title()).resolves.toMatch('Slad');
});

// https://github.com/steida/slad/issues/14
export default undefined;
