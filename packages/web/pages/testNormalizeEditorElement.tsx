import React, { useState } from 'react';
import * as editor from 'slad';

const initialEditorState = editor.createEditorState({
  element: editor.normalizeEditorElement({
    id: editor.id(),
    tag: 'div',
    props: {
      className: 'root',
    },
    children: [
      {
        id: editor.id(),
        tag: 'div',
        props: {
          className: 'list',
        },
        children: [
          { id: editor.id(), text: 'a' },
          { id: editor.id(), text: 'b' },
          { id: editor.id(), text: '' },
          { id: editor.id(), text: 'c' },
        ],
      },
    ],
  } as editor.EditorReactElement),
});

function TestNormalizeEditorElement() {
  const [editorState, setEditorState] = useState(initialEditorState);

  return <editor.Editor editorState={editorState} onChange={setEditorState} />;
}

export default TestNormalizeEditorElement;
