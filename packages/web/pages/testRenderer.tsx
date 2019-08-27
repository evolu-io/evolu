import React from 'react';
import { Renderer, EditorReactDOMElement } from 'slad';
// import {
//   initialSchemaRootElement,
//   useSchemaRenderElement,
// } from '../components/examples/SchemaExample';

export const initialEditorReactDOMElement: EditorReactDOMElement = {
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
      children: ['paragraph'],
    },
  ],
};

function TestRenderer() {
  return (
    <div>
      <Renderer element={initialEditorReactDOMElement} />
      {/* <Renderer
        element={initialSchemaRootElement}
        renderElement={useSchemaRenderElement}
      /> */}
    </div>
  );
}

export default TestRenderer;
