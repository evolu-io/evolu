import React, { useState } from 'react';
import { Editor, EditorState } from 'slad';

function TestRenderReactDOMElement() {
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
          children: [''],
        },
        {
          tag: 'img',
          props: {
            src: 'https://via.placeholder.com/80',
            alt: 'Square placeholder image 80px',
            width: 80,
            height: 80,
          },
        },
      ],
    },
  });

  return <Editor editorState={editorState} onChange={setEditorState} />;
}

export default TestRenderReactDOMElement;
