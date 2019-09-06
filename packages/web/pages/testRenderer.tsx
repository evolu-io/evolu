import React from 'react';
import { Renderer } from 'slad';
import { Draft } from 'immer';
import { initialEditorState as initialBasicEditorState } from '../components/examples/BasicExample';
import {
  initialEditorState as initialSchemaEditorState,
  useSchemaRenderElement,
  SchemaRootElement,
} from '../components/examples/SchemaExample';

function TestRenderer() {
  const renderSchemaElement = useSchemaRenderElement();
  return (
    <div>
      <Renderer element={initialBasicEditorState.element} />
      <Renderer
        element={initialSchemaEditorState.element as Draft<SchemaRootElement>}
        renderElement={renderSchemaElement}
      />
      <Renderer
        element={{
          children: [{ text: '' }],
        }}
      />
    </div>
  );
}

export default TestRenderer;
