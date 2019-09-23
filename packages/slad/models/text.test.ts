import { insertTextToString } from './text';

test('insertTextToString', () => {
  expect(insertTextToString('', 'a', 0)).toBe('a');
  expect(insertTextToString('ac', 'b', 1)).toBe('abc');
});
