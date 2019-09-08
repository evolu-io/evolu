import React from 'react';
import { Renderer, id, EditorDOMElement } from 'slad';
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
      <Renderer<EditorDOMElement>
        element={{
          id: id(),
          tag: 'div',
          children: [{ id: id(), text: '' }],
        }}
      />
    </div>
  );
}

export default TestRenderer;
