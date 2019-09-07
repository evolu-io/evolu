import React, { useState, useCallback } from 'react';
import {
  Editor,
  useLogEditorState,
  createEditorState,
  EditorState,
  EditorDOMElement,
} from 'slad';

const initialEditorState = createEditorState<EditorDOMElement>({
  element: {
    tag: 'div',
    children: [
      {
        tag: 'div',
        props: {
          style: { fontSize: '24px' },
        },
        children: [{ text: 'heading' }],
      },
      {
        tag: 'div',
        props: {
          style: { fontSize: '16px' },
        },
        children: [{ text: 'paragraph' }],
      },
    ],
  },
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
