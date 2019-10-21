import Head from 'next/head';
import React, { useCallback, useState } from 'react';
import * as editor from 'evolu';
import { Container } from '../components/Container';
import { defaultEditorProps } from '../components/examples/_defaultEditorProps';
import { Text } from '../components/Text';

const initialValue = editor.createValue({
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
  const [value, setValue] = useState(initialValue);

  const [logValue, logValueElement] = editor.useLogValue(value);

  const handleEditorChange = useCallback(
    (value: editor.Value) => {
      logValue(value);
      setValue(value);
    },
    [logValue],
  );

  return (
    <Container>
      <Head>
        <title>Sandbox</title>
      </Head>
      <Text size={2}>Sandbox</Text>
      <editor.Editor
        value={value}
        // TODO:
        // reducer={customReducer}
        onChange={handleEditorChange}
        style={defaultEditorProps.style}
        spellCheck
      />
      {logValueElement}
      <button
        type="button"
        onMouseDown={event => {
          event.preventDefault();
          // handleEditorChange(nextValue);
        }}
      >
        update value
      </button>
    </Container>
  );
}

export default Index;
