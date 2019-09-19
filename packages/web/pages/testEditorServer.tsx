import React from 'react';
import { EditorServer, id, EditorReactElement } from 'slad';
import { initialEditorState as initialBasicEditorState } from '../components/examples/BasicExample';
import {
  initialEditorState as initialSchemaEditorState,
  useSchemaRenderElement,
  SchemaDocumentElement,
} from '../components/examples/SchemaExample';

function TestEditorServer() {
  const renderSchemaElement = useSchemaRenderElement();
  return (
    <div>
      <EditorServer
        element={initialBasicEditorState.element as EditorReactElement}
      />
      <EditorServer
        element={initialSchemaEditorState.element as SchemaDocumentElement}
        renderElement={renderSchemaElement}
      />
      <EditorServer<EditorReactElement>
        element={{
          id: id(),
          tag: 'div',
          children: [{ id: id(), text: '' }],
        }}
      />
    </div>
  );
}

export default TestEditorServer;
