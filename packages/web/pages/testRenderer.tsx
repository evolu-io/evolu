import React from 'react';
import { Renderer } from 'slad';
import { initialBasicElement } from '../components/examples/BasicExample';
// import {
//   initialSchemaRootElement,
//   useSchemaRenderElement,
// } from '../components/examples/SchemaExample';

function TestRenderer() {
  return (
    <div>
      <Renderer element={initialBasicElement} />
      {/* <Renderer
        element={initialSchemaRootElement}
        renderElement={useSchemaRenderElement}
      /> */}
    </div>
  );
}

export default TestRenderer;
