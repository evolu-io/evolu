import React from 'react';
import * as editor from 'evolu';
import { initialValue as initialBasicValue } from '../components/examples/BasicExample';
import {
  initialValue as initialSchemaValue,
  useSchemaRenderElement,
} from '../components/examples/SchemaExample';

const reactElement: editor.ReactElement = {
  id: editor.id(),
  tag: 'div',
  children: ['a', 'b', '', 'c'],
};

const TestEditorServer = () => {
  const renderSchemaElement = useSchemaRenderElement();
  return (
    <div>
      <editor.EditorServer element={initialBasicValue.element} />
      <editor.EditorServer
        element={initialSchemaValue.element}
        renderElement={renderSchemaElement}
      />
      <editor.EditorServer element={reactElement} />
    </div>
  );
};

export default TestEditorServer;
