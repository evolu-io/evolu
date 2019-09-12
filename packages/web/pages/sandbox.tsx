import React, { useState, useCallback } from 'react';
import Head from 'next/head';
import {
  EditorState,
  useLogEditorState,
  Editor,
  createEditorState,
  jsxToEditorDOMElement,
} from 'slad';
import { Text } from '../components/Text';
import { Container } from '../components/Container';
import { defaultEditorProps } from '../components/examples/_defaultEditorProps';

const initialEditorState = createEditorState({
  element: jsxToEditorDOMElement(
    <div className="root">
      <div style={{ fontSize: '24px' }}>heading</div>
      <div style={{ fontSize: '16px' }}>paragraph</div>
      <span className="text">fixx me</span>
    </div>,
  ),
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
        style={defaultEditorProps.style}
        // spellCheck
      />
      {logEditorStateElement}
    </Container>
  );
}

export default Index;
