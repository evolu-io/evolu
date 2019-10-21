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
        children: [
          { id: editor.id(), text: 'a' },
          { id: editor.id(), text: 'b' },
          { id: editor.id(), text: '' },
          { id: editor.id(), text: 'c' },
        ],
      },
    ],
  } as editor.ReactElement),
});

function TestNormalizeEditorElement() {
  const [value, setValue] = useState(initialValue);

  return <editor.Editor value={value} onChange={setValue} />;
}

export default TestNormalizeEditorElement;
