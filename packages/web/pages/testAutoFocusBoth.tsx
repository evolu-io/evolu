import React from 'react';
import { BasicExample } from '../components/examples/BasicExample';
import { SchemaExample } from '../components/examples/SchemaExample';

function TestAutoFocusBoth() {
  return (
    <>
      <BasicExample autoFocus />
      <SchemaExample autoFocus />
    </>
  );
}

export default TestAutoFocusBoth;
