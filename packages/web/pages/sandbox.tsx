import React, { useState, useCallback } from 'react';
import Head from 'next/head';
import {
  EditorState,
  useLogEditorState,
  Editor,
  createEditorState,
  EditorReactDOMElement,
} from 'slad';
import { Text } from '../components/Text';
import { Container } from '../components/Container';
import { defaultEditorProps } from '../components/examples/_defaultEditorProps';

const initialEditorState = createEditorState<EditorReactDOMElement>({
  element: {
    tag: 'div',
    children: [
      // 'a',
      {
        tag: 'div',
        props: {
          style: { fontSize: '24px' },
        },
        children: [{ text: 'heading' }],
      },
      {
        tag: 'div',
        props: {
          style: { fontSize: '16px' },
        },
        children: [{ text: 'paragraph' }],
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
      {/* <textarea /> */}
      <Editor
        editorState={editorState}
        onChange={handleEditorChange}
        // TODO: Test
        // spellCheck
        style={defaultEditorProps.style}
      />
      {logEditorStateElement}
    </Container>
  );
}

export default Index;
