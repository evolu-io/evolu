import React, { useState } from 'react';
import { Editor, createEditorState, id } from 'slad';

const initialEditorState = createEditorState({
  element: {
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
          style: { fontSize: '24px' },
        },
        children: [{ id: id(), text: 'heading' }],
      },
      {
        id: id(),
        tag: 'div',
        props: {
          style: { fontSize: '16px' },
        },
        children: [{ id: id(), text: '' }],
      },
      {
        id: id(),
        tag: 'img',
        props: {
          src: 'https://via.placeholder.com/80',
          alt: 'Square placeholder image 80px',
          width: 80,
          height: 80,
        },
        children: [],
      },
    ],
  },
});

function TestRenderReactDOMElement() {
  const [editorState, setEditorState] = useState(initialEditorState);

  return <Editor editorState={editorState} onChange={setEditorState} />;
}

export default TestRenderReactDOMElement;
