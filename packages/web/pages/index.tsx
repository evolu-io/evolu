import React, { useState, useCallback } from 'react';
import { SladEditor, SladValue } from 'slad';
import { Text } from '../components/Text';
import { Container } from '../components/Container';

const initialState: SladValue = {
  element: {
    props: {
      style: { width: '100px', backgroundColor: 'red' },
    },
    children: [
      {
        props: {
          style: { fontSize: '24px' },
        },
        children: [{ type: 'text', value: 'heading 1' }],
      },
      {
        props: {
          style: { fontSize: '16px' },
        },
        children: [{ type: 'text', value: 'paragraph' }],
      },
    ],
  },
};

function Index() {
  const [editorValue, setEditorValue] = useState<SladValue>(initialState);

  const handleSladEditorChange = useCallback((value: SladValue) => {
    setEditorValue(value);
  }, []);

  return (
    <Container>
      <Text size={1}>Slad</Text>
      <Text>TODO: Everything</Text>
      <SladEditor
        value={editorValue}
        onChange={handleSladEditorChange}
        autoCorrect="off" // Disable browser autoCorrect.
        spellCheck={false} // Disable browser spellCheck.
        data-gramm // Disable Grammarly Chrome extension.
      />
    </Container>
  );
}

export default Index;
