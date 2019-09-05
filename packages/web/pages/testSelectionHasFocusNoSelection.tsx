import React, { useState, useCallback } from 'react';
import {
  Editor,
  EditorState,
  useLogEditorState,
  createEditorState,
} from 'slad';

const initialEditorState = createEditorState({
  element: {
    children: [
      {
        props: {
          style: { fontSize: '24px' },
        },
        children: ['heading'],
      },
      {
        props: {
          style: { fontSize: '16px' },
        },
        children: ['paragraph'],
      },
    ],
  },
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
