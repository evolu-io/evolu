import React, { useState } from 'react';
import * as editor from 'evolu';

const initialState = editor.createState({
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
  const [state, setState] = useState(initialState);

  return <editor.Editor state={state} onChange={setState} />;
}

export default TestNormalizeEditorElement;
