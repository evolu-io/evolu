import { insertText } from './text';

test('insertText', () => {
  expect(insertText('', 'a', 0)).toBe('a');
  expect(insertText('ac', 'b', 1)).toBe('abc');
});
