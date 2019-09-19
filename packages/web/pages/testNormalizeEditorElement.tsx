import React, { useState } from 'react';
import {
  Editor,
  normalizeEditorElement,
  createEditorState,
  EditorReactElement,
  id,
} from 'slad';

const initialEditorState = createEditorState({
  element: normalizeEditorElement<EditorReactElement>({
    id: id(),
    tag: 'div',
    props: {
      className: 'root',
    },
    children: [
      {
        id: id(),
        tag: 'div',
        props: {
          className: 'list',
        },
        children: [
          { id: id(), text: 'a' },
          { id: id(), text: 'b' },
          { id: id(), text: '' },
          { id: id(), text: 'c' },
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
