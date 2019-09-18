import { editorReducer, EditorAction } from './editorReducer';
import { createEditorStateWithText } from '../models/state';
import { recursiveRemoveID } from '../models/element';

const editorState = createEditorStateWithText({ text: '' });

function testEditorReducer(action: EditorAction) {
  const { element, ...nextState } = editorReducer(editorState, action);
  return {
    ...nextState,
    element: recursiveRemoveID(element),
  };
}

test('onFocus', () => {
  expect(testEditorReducer({ type: 'onFocus' })).toMatchSnapshot();
});

test('onBlur', () => {
  expect(testEditorReducer({ type: 'onBlur' })).toMatchSnapshot();
});
