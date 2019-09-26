import { isEditorText } from './text';

test('isEditorText', () => {
  expect(isEditorText({})).toBe(false);
  expect(isEditorText({ text: 'a' })).toBe(false);
  expect(isEditorText({ text: 'a', id: '1' })).toBe(true);
});
