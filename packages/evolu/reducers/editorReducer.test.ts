import { editorReducer, EditorAction } from './editorReducer';
import { createEditorStateWithText } from '../models/state';
import { recursiveRemoveID } from '../models/element';

const editorState = createEditorStateWithText();

function testEditorReducer(action: EditorAction) {
  const { element, ...nextState } = editorReducer(editorState, action);
  return {
    ...nextState,
    element: recursiveRemoveID(element),
  };
}

test('focus', () => {
  expect(testEditorReducer({ type: 'focus' })).toMatchSnapshot();
});

test('blur', () => {
  expect(testEditorReducer({ type: 'blur' })).toMatchSnapshot();
});
