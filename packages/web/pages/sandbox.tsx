import React, { useState, useCallback } from 'react';
import Head from 'next/head';
import {
  EditorState,
  useLogEditorState,
  Editor,
  createEditorState,
} from 'slad';
import { Text } from '../components/Text';
import { Container } from '../components/Container';

const initialEditorState = createEditorState({
  element: {
    children: ['g'],
  },
});

function Index() {
  const [editorState, setEditorState] = useState(initialEditorState);

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
