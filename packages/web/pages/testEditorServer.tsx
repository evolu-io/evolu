import React from 'react';
import * as editor from 'evolu';
import { initialState as initialBasicState } from '../components/examples/BasicExample';
import {
  initialState as initialSchemaState,
  useSchemaRenderElement,
  SchemaDocumentElement,
} from '../components/examples/SchemaExample';

function TestEditorServer() {
  const renderSchemaElement = useSchemaRenderElement();
  return (
    <div>
      <editor.EditorServer
        element={initialBasicState.element as editor.ReactElement}
      />
      <editor.EditorServer
        element={initialSchemaState.element as SchemaDocumentElement}
        renderElement={renderSchemaElement}
      />
      <editor.EditorServer
        element={
          {
            id: editor.id(),
            tag: 'div',
            children: [
              { id: editor.id(), text: 'a' },
              { id: editor.id(), text: 'b' },
              { id: editor.id(), text: '' },
              { id: editor.id(), text: 'c' },
            ],
          } as editor.ReactElement
        }
      />
    </div>
  );
}

export default TestEditorServer;
