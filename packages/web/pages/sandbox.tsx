import Head from 'next/head';
import React, { useCallback, useState } from 'react';
import * as editor from 'evolu';
import { Container } from '../components/Container';
import { defaultEditorProps } from '../components/examples/_defaultEditorProps';
import { Text } from '../components/Text';

const initialEditorState = editor.createEditorState({
  element: editor.jsx(
    <div className="root">
      <div
        style={{
          fontSize: '24px',
          // whiteSpace: 'pre'
        }}
      >
        {/* <br /> */}
        {/* <div style={{ fontWeight: 'bold', display: 'inline' }}>heading</div> */}
        heading
        {/* To test normalize */}
        {/* {'heading'}
        {'foo'} */}
        {/* <div
          contentEditable={false}
          style={{
            display: 'inline-block',
            width: 10,
            height: 10,
            backgroundColor: 'red',
          }}
        >
          <br />
        </div>
        bla */}
      </div>
      <div style={{ fontSize: '16px' }}>paragraph</div>
      {/* <span className="text">fixx me</span> */}
      {/* <div style={{ fontSize: '16px' }}>
        foo
        <br />
        bla
      </div> */}
    </div>,
  ),
});

function Index() {
  const [editorState, setEditorState] = useState(initialEditorState);

  const [logEditorState, logEditorStateElement] = editor.useLogEditorState(
    editorState,
  );

  const handleEditorChange = useCallback(
    (state: editor.EditorState) => {
      logEditorState(state);
      setEditorState(state);
    },
    [logEditorState],
  );

  return (
    <Container>
      <Head>
        <title>Sandbox</title>
      </Head>
      <Text size={2}>Sandbox</Text>
      <editor.Editor
        editorState={editorState}
        // TODO:
        // editorReducer={customReducer}
        onChange={handleEditorChange}
        style={defaultEditorProps.style}
        spellCheck
      />
      {logEditorStateElement}
      <button
        type="button"
        onMouseDown={event => {
          event.preventDefault();
          // const nextState = editor.setText('foo')(editorState);
          // const nextState = editor.move(1)(editorState);
          // odebrat prvni, druhej, jejich switch, jo!
          // switch
          const nextState = {
            ...editorState,
            element: {
              ...editorState.element,
              children: [...editorState.element.children].reverse(),
            },
          };
          // // remove second
          // const nextState = {
          //   ...editorState,
          //   element: {
          //     ...editorState.element,
          //     children: editorState.element.children.slice(1),
          //   },
          // };
          handleEditorChange(nextState);
          //   // switch
          //   // const first = draft.element.children[0];
          //   // const second = draft.element.children[1];
          //   // draft.element.children[0] = second;
          //   // draft.element.children[1] = first;
        }}
      >
        update model
      </button>
    </Container>
  );
}

export default Index;
