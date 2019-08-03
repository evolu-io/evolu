import React, { useState, useCallback } from 'react';
import { SladEditor, SladValue } from 'slad';
import { Text } from '../components/Text';

const initialState: SladValue = '';

function Index() {
  const [editorValue, setEditorValue] = useState<SladValue>(initialState);

  const handleSladEditorChange = useCallback((value: SladValue) => {
    setEditorValue(value);
  }, []);

  return (
    <>
      <div>
        <Text size={1}>Slad</Text>
        <Text>TODO: Everything</Text>
        <SladEditor value={editorValue} onChange={handleSladEditorChange} />
      </div>
      <style jsx>{`
        div {
          margin: 16px;
        }
      `}</style>
    </>
  );
}

export default Index;
