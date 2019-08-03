import React, { useState, useCallback } from 'react';
import { SladEditor, SladValue } from 'slad';
import { Text } from '../components/Text';
import { Container } from '../components/Container';

const initialState: SladValue = '';

function Index() {
  const [editorValue, setEditorValue] = useState<SladValue>(initialState);

  const handleSladEditorChange = useCallback((value: SladValue) => {
    setEditorValue(value);
  }, []);

  return (
    <Container>
      <Text size={1}>Slad</Text>
      <Text>TODO: Everything</Text>
      <SladEditor value={editorValue} onChange={handleSladEditorChange} />
    </Container>
  );
}

export default Index;
