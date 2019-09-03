import React from 'react';
import { Renderer } from 'slad';
import { initialEditorReactDOMElement } from '../components/examples/BasicExample';
import {
  initialSchemaRootElement,
  useSchemaRenderElement,
} from '../components/examples/SchemaExample';

function TestRenderer() {
  const renderSchemaElement = useSchemaRenderElement();
  return (
    <div>
      <Renderer element={initialEditorReactDOMElement} />
      <Renderer
        element={initialSchemaRootElement}
        renderElement={renderSchemaElement}
      />
      <Renderer
        element={{
          children: [''],
        }}
      />
    </div>
  );
}

export default TestRenderer;
