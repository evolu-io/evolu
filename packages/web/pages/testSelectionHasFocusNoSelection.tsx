import React, { useState, useCallback } from 'react';
import {
  Editor,
  EditorState,
  useLogEditorState,
  createEditorState,
} from 'slad';
import { testSelectionElement } from './testSelection';

const initialEditorState = createEditorState({
  element: testSelectionElement,
  hasFocus: true,
});

function TestSelectionHasFocusNoSelection() {
  const [editorState, setEditorState] = useState(initialEditorState);

  const [logEditorState, logEditorStateElement] = useLogEditorState(
    editorState,
  );

  const handleEditorChange = useCallback(
    (editorState: EditorState) => {
      logEditorState(editorState);
      setEditorState(editorState);
    },
    [logEditorState],
  );

  return (
    <>
      <Editor editorState={editorState} onChange={handleEditorChange} />
      {logEditorStateElement}
    </>
  );
}

export default TestSelectionHasFocusNoSelection;
