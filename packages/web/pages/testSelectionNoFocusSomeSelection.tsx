import React, { useState, useCallback } from 'react';
import {
  Editor,
  EditorState,
  useLogEditorState,
  createEditorState,
} from 'slad';
import { some } from 'fp-ts/lib/Option';
import { testSelectionElement } from './testSelection';

const initialEditorState = createEditorState({
  element: testSelectionElement,
  hasFocus: false,
  selection: some({
    anchor: [0, 0, 0],
    focus: [0, 0, 2],
  }),
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
