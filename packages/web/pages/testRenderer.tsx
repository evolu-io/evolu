import React from 'react';
import { Renderer, id } from 'slad';
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
          id: id(),
          children: [{ id: id(), text: '' }],
        }}
      />
    </div>
  );
}

export default TestRenderer;
