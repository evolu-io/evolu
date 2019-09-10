import React, { useState, useCallback } from 'react';
import {
  Editor,
  useLogEditorState,
  createEditorState,
  EditorState,
} from 'slad';
import { testSelectionElement } from './testSelection';

const initialEditorState = createEditorState({
  element: testSelectionElement,
});

function TestSelectionNoFocusNoSelection() {
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

export default TestSelectionNoFocusNoSelection;
