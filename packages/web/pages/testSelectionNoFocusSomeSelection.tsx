import React, { useState, useCallback } from 'react';
import { Editor, EditorState, useLogEditorState } from 'slad';

function TestSelectionNoFocusSomeSelection() {
  const [editorState, setEditorState] = useState<EditorState>({
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
    selection: {
      anchor: [0, 0, 0],
      focus: [0, 0, 2],
    },
  });

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
