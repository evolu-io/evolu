import React from 'react';
import { BasicExample } from '../components/examples/BasicExample';
import { SchemaExample } from '../components/examples/SchemaExample';

function TestAutoFocusFirst() {
  return (
    <>
      <BasicExample autoFocus />
      <SchemaExample />
    </>
  );
}

export default TestAutoFocusFirst;
