import React, { useState } from 'react';
import {
  Editor,
  normalizeEditorElement,
  createEditorState,
  EditorDOMElement,
  id,
} from 'slad';

const initialEditorState = createEditorState<EditorDOMElement>({
  element: normalizeEditorElement({
    id: id(),
    tag: 'div',
    children: [
      {
        id: id(),
        tag: 'div',
        children: [
          { id: id(), text: 'a' },
          { id: id(), text: '' },
          { id: id(), text: 'b' },
        ],
      },
    ],
  }),
});

function TestNormalizeEditorElement() {
  const [editorState, setEditorState] = useState(initialEditorState);

  return <Editor editorState={editorState} onChange={setEditorState} />;
}

export default TestNormalizeEditorElement;
