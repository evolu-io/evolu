import React, { useState, useCallback } from 'react';
import {
  Editor,
  EditorState,
  useLogEditorState,
  createEditorState,
  EditorDOMElement,
} from 'slad';
import { testSelectionElement } from './testSelection';

const initialEditorState = createEditorState<EditorDOMElement>({
  element: testSelectionElement,
  hasFocus: false,
  selection: {
    anchor: [0, 0, 0],
    focus: [0, 0, 2],
  },
});

function TestSelectionNoFocusSomeSelection() {
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

export default TestSelectionNoFocusSomeSelection;
