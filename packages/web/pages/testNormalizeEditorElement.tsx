import React, { useState } from 'react';
import * as editor from 'evolu';

const initialValue = editor.createValue({
  element: editor.normalizeElement({
    id: editor.id(),
    tag: 'div',
    props: {
      className: 'root',
    },
    children: [
      {
        id: editor.id(),
        tag: 'div',
        props: {
          className: 'list',
        },
        children: ['a', 'b', '', 'c'],
      },
    ],
  } as editor.ReactElement),
});

const TestNormalizeEditorElement = () => {
  const [value, setValue] = useState(initialValue);

  return <editor.Editor value={value} onChange={setValue} />;
};

export default TestNormalizeEditorElement;
