import { isEditorText, EditorText } from './text';
import { id, EditorNode } from './node';
import { EditorElement } from './element';

test('isEditorText', () => {
  const editorNode: EditorNode = { id: id() };
  expect(isEditorText(editorNode)).toBe(false);

  const editorElement: EditorElement = { id: id(), children: [] };
  expect(isEditorText(editorElement)).toBe(false);

  const editorText: EditorText = { id: id(), text: 'f' };
  expect(isEditorText(editorText)).toBe(true);
});
