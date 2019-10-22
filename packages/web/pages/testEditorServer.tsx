import React from 'react';
import * as editor from 'evolu';
import { initialValue as initialBasicValue } from '../components/examples/BasicExample';
import {
  initialValue as initialSchemaValue,
  useSchemaRenderElement,
  SchemaDocumentElement,
} from '../components/examples/SchemaExample';

const TestEditorServer = () => {
  const renderSchemaElement = useSchemaRenderElement();
  return (
    <div>
      <editor.EditorServer
        element={initialBasicValue.element as editor.ReactElement}
      />
      <editor.EditorServer
        element={initialSchemaValue.element as SchemaDocumentElement}
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
};

export default TestEditorServer;
