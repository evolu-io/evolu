import React, { useState, useCallback } from 'react';
import Head from 'next/head';
import {
  EditorState,
  useLogEditorState,
  Editor,
  createEditorState,
  id,
} from 'slad';
import { Text } from '../components/Text';
import { Container } from '../components/Container';
import { defaultEditorProps } from '../components/examples/_defaultEditorProps';

const initialEditorState = createEditorState({
  element: {
    id: id(),
    tag: 'div',
    children: [
      // 'a',
      {
        id: id(),
        tag: 'div',
        props: {
          style: { fontSize: '24px' },
        },
        children: [{ id: id(), text: 'heading' }],
      },
      {
        id: id(),
        tag: 'div',
        props: {
          style: { fontSize: '16px' },
        },
        children: [{ id: id(), text: 'paragraph' }],
      },
    ],
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
        <title>Sandbox</title>
      </Head>
      <Text size={2}>Sandbox</Text>
      <Editor
        editorState={editorState}
        onChange={handleEditorChange}
        // spellCheck
        style={defaultEditorProps.style}
      />
      {logEditorStateElement}
    </Container>
  );
}

export default Index;
