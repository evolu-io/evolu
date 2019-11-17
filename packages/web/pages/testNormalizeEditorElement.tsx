import React, { useState } from 'react';
import { createValue, normalizeElement, id, Editor, ReactElement } from 'evolu';

const initialValue = createValue({
  element: normalizeElement({
    id: id(),
    tag: 'div',
    props: {
      className: 'root',
    },
    children: [
      {
        id: id(),
        tag: 'div',
        props: {
          className: 'list',
        },
        children: ['a', 'b', '', 'c'],
      },
    ],
  } as ReactElement),
});

const TestNormalizeEditorElement = () => {
  const [value, setValue] = useState(initialValue);

  return <Editor value={value} onChange={setValue} />;
};

export default TestNormalizeEditorElement;
