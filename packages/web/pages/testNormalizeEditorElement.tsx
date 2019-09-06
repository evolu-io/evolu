import React, { useState } from 'react';
import { Editor, normalizeEditorElement, createEditorState } from 'slad';

const initialEditorState = createEditorState({
  element: normalizeEditorElement({
    children: [
      {
        children: [{ text: 'a' }, { text: '' }, { text: 'b' }],
      },
    ],
  }),
});

function TestNormalizeEditorElement() {
  const [editorState, setEditorState] = useState(initialEditorState);

  return <Editor editorState={editorState} onChange={setEditorState} />;
}

export default TestNormalizeEditorElement;
