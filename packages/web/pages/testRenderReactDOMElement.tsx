import React from 'react';
import { Editor, EditorValue, useLogEditorValue } from 'slad';

function TestRenderReactDOMElement() {
  const editorValue: EditorValue = {
    element: {
      children: [
        {
          props: {
            style: { fontSize: '24px' },
          },
          children: ['heading'],
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
  };

  return <Editor value={editorValue} onChange={() => {}} />;
}

export default TestRenderReactDOMElement;
