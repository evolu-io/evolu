import React from 'react';
import { ReactElement, id, EditorServer } from 'evolu';
import { initialValue as initialBasicValue } from '../components/examples/BasicExample';
import {
  initialValue as initialSchemaValue,
  useSchemaRenderElement,
} from '../components/examples/SchemaExample';

const reactElement: ReactElement = {
  id: id(),
  tag: 'div',
  props: {},
  children: ['a', 'b', '', 'c'],
};

const TestEditorServer = () => {
  const renderSchemaElement = useSchemaRenderElement();
  return (
    <div>
      <EditorServer element={initialBasicValue.element} />
      <EditorServer
        element={initialSchemaValue.element}
        renderElement={renderSchemaElement}
      />
      <EditorServer element={reactElement} />
    </div>
  );
};

export default TestEditorServer;
