import React, { useState, useCallback } from 'react';
import Head from 'next/head';
import {
  EditorState,
  useLogEditorState,
  Editor,
  EditorReactDOMElement,
} from 'slad';
import { Text } from '../components/Text';
import { Container } from '../components/Container';

export const initialElement: EditorReactDOMElement = {
  children: [
    'g',
    // {
    //   props: {
    //     style: { fontSize: '24px' },
    //   },
    //   // children: [''],
    //   children: ['foo'],
    // },
    // {
    //   props: {
    //     style: { fontSize: '16px' },
    //   },
    //   children: ['paragraph'],
    // },
  ],
};

function Index() {
  const [editorState, setEditorState] = useState<EditorState>({
    element: initialElement,
    // hasFocus: true,
    // selection: { anchor: [0, 0, 0], focus: [0, 0, 2] },
  });

  const [logEditorState, logEditorStateElement] = useLogEditorState(
    editorState,
  );

  const handleEditorChange = useCallback(
    (editorState: EditorState) => {
      logEditorState(editorState);
      setEditorState(editorState);
    },
    [logEditorState],
  );

  return (
    <Container>
      <Head>
        <title>Slad</title>
      </Head>
      <Text size={2}>Slad</Text>
      {/* <textarea /> */}
      <Editor
        editorState={editorState}
        onChange={handleEditorChange}
        spellCheck
        style={{
          // whiteSpace: 'pre-wrap',
          backgroundColor: '#eee',
          marginBottom: 24,
          outline: 'none',
          padding: 8,
          width: 300,
        }}
      />
      {logEditorStateElement}
    </Container>
  );
}

export default Index;
