import {
  createValue,
  Editor,
  jsx,
  useEditorRef,
  useLogValue,
  Value,
} from 'evolu';
import Head from 'next/head';
import React, { useCallback, useState } from 'react';
import { Container } from '../components/Container';
import { defaultEditorProps } from '../components/examples/_defaultEditorProps';
import { Text } from '../components/Text';

// import * as editor from 'evolu'

const initialValue = createValue({
  element: jsx(
    <div className="root">
      <div
        style={{
          fontSize: '24px',
          // whiteSpace: 'pre'
        }}
      >
        {/* <br /> */}
        heading
        {/* hello{' '}
        <span
          style={{
            fontWeight: 'bold',
            // display: 'block',
          }}
        >
          world
        </span>
        , foo */}
        {/* <span style={{ fontWeight: 'bold' }}>foo</span> */}
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
      <div style={{ fontSize: '16px' }}>
        paragraph with{' '}
        <i data-foo>
          <b data-foo>bold italic</b>
        </i>{' '}
        text
      </div>
      <img
        alt="Square placeholder"
        src="https://via.placeholder.com/80"
        style={{ width: 50, height: 80 }}
      />
      {/* <div style={{ border: 'solid 1px #ccc', padding: '3px' }}>
        <img
          alt="Square placeholder"
          src="https://via.placeholder.com/80"
          style={{ width: 50, height: 80 }}
        />
      </div> */}
      <div style={{ fontSize: '16px' }}>
        bar <b data-foo>bla</b> baz
      </div>
      {/* <span className="text">fixx me</span> */}
      {/* <div style={{ fontSize: '16px' }}>
        foo
        <br />
        bla
      </div> */}
    </div>,
  ),
});

const Sandbox = () => {
  const [value, setValue] = useState(initialValue);

  const [logValue, logValueElement] = useLogValue(value);

  const handleEditorChange = useCallback(
    (value: Value) => {
      logValue(value);
      setValue(value);
    },
    [logValue],
  );

  const editorRef = useEditorRef();

  return (
    <Container>
      <Head>
        <title>Sandbox</title>
      </Head>
      <Text size={2}>Sandbox</Text>
      <Editor
        ref={editorRef}
        value={value}
        onChange={handleEditorChange}
        style={defaultEditorProps.style}
        spellCheck
      />
      {logValueElement}
      <button
        type="button"
        onMouseDown={event => {
          event.preventDefault();
          if (editorRef.current) editorRef.current.focus();
        }}
      >
        foo
      </button>
    </Container>
  );
};

export default Sandbox;
