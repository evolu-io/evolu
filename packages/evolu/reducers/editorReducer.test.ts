import { editorReducer, EditorAction } from './editorReducer';
import { createValueWithText } from '../models/value';
import { mapElementToIDless } from '../models/element';

const value = createValueWithText();

function testEditorReducer(action: EditorAction) {
  const { element, ...nextValue } = editorReducer(value, action);
  return {
    ...nextValue,
    element: mapElementToIDless(element),
  };
}

test('focus', () => {
  expect(testEditorReducer({ type: 'focus' })).toMatchSnapshot();
});

test('blur', () => {
  expect(testEditorReducer({ type: 'blur' })).toMatchSnapshot();
});
