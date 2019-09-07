import React, { useState } from 'react';
import {
  Editor,
  normalizeEditorElement,
  createEditorState,
  EditorDOMElement,
} from 'slad';

const initialEditorState = createEditorState<EditorDOMElement>({
  element: normalizeEditorElement({
    tag: 'div',
    children: [
      {
        tag: 'div',
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
