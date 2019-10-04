import Head from 'next/head';
import React, { useCallback, useState } from 'react';
import * as editor from 'slad';
import { Container } from '../components/Container';
import { defaultEditorProps } from '../components/examples/_defaultEditorProps';
import { Text } from '../components/Text';

const initialEditorState = editor.createEditorState({
  element: editor.jsxToEditorReactElement(
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
          // TODO: Replace produce with sane mappers.
          // const nextState = produce(editorState, draft => {
          //   // @ts-ignore
          //   draft.element.children[0].children[0].text += ' foo';
          //   // draft.element.children[0].children[0].text = '';
          //   // draft.element.children.splice(0, 1);
          //   // jak zmenim path?
          //   // switch
          //   // const first = draft.element.children[0];
          //   // const second = draft.element.children[1];
          //   // draft.element.children[0] = second;
          //   // draft.element.children[1] = first;

          //   // const first = draft.element.children[0].children[0];
          //   // // @ts-ignore
          //   // const second = draft.element.children[0].children[2];
          //   // // @ts-ignore
          //   // draft.element.children[0].children[0] = second;
          //   // // @ts-ignore
          //   // draft.element.children[0].children[2] = first;

          //   // console.log(original(first));
          //   // console.log(original(second));

          //   // draft.element.children[0] = second;
          //   // draft.element.children[2] = first;
          //   // console.log(original(draft.element.children));
          // });
          // handleEditorChange(nextState);
        }}
      >
        update model 1
      </button>
      <button
        type="button"
        onMouseDown={event => {
          event.preventDefault();
          // const nextState = produce(editorState, draft => {
          //   // @ts-ignore
          //   // console.log(original(draft.element.children));
          //   draft.element.children.splice(0, 1);
          // });
          // handleEditorChange(nextState);
        }}
      >
        update model 2
      </button>
    </Container>
  );
}

export default Index;
