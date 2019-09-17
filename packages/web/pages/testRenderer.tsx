import React from 'react';
import { Renderer, id, EditorDOMElement } from 'slad';
import { initialEditorState as initialBasicEditorState } from '../components/examples/BasicExample';
import {
  initialEditorState as initialSchemaEditorState,
  useSchemaRenderElement,
  SchemaDocumentElement,
} from '../components/examples/SchemaExample';

function TestRenderer() {
  const renderSchemaElement = useSchemaRenderElement();
  return (
    <div>
      <Renderer element={initialBasicEditorState.element as EditorDOMElement} />
      <Renderer
        element={initialSchemaEditorState.element as SchemaDocumentElement}
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
