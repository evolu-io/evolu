import React, { useState } from 'react';
import {
  Editor,
  normalizeEditorElement,
  createEditorState,
  EditorReactDOMElement,
} from 'slad';

const initialEditorState = createEditorState<EditorReactDOMElement>({
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
