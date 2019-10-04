import React, { useState, useCallback } from 'react';
import * as editor from 'slad';
import { testSelectionElement } from './testSelection';

const initialEditorState = editor.createEditorState({
  element: testSelectionElement,
});

function TestSelectionNoFocusNoSelection() {
  const [editorState, setEditorState] = useState(initialEditorState);

  const [logEditorState, logEditorStateElement] = editor.useLogEditorState(
    editorState,
  );

  const handleEditorChange = useCallback(
    (editorState: editor.EditorState) => {
      logEditorState(editorState);
      setEditorState(editorState);
    },
    [logEditorState],
  );

  return (
    <>
      <editor.Editor editorState={editorState} onChange={handleEditorChange} />
      {logEditorStateElement}
    </>
  );
}

export default TestSelectionNoFocusNoSelection;
