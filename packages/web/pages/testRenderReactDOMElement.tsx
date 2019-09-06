import React, { useState } from 'react';
import { Editor, createEditorState } from 'slad';

const initialEditorState = createEditorState({
  element: {
    children: [
      {
        props: {
          style: { fontSize: '24px' },
        },
        children: [{ text: 'heading' }],
      },
      {
        props: {
          style: { fontSize: '16px' },
        },
        children: [{ text: '' }],
      },
      {
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
