import { editorReducer, EditorAction } from './editorReducer';
import { createStateWithText } from '../models/state';
import { recursiveRemoveID } from '../models/element';

const state = createStateWithText();

function testEditorReducer(action: EditorAction) {
  const { element, ...nextState } = editorReducer(state, action);
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
