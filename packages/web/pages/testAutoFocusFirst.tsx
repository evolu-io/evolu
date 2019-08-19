import React from 'react';
import { BasicExample } from '../components/examples/BasicExample';
import { SchemaExample } from '../components/examples/SchemaExample';

function TestAutoFocusFirst() {
  return (
    <>
      <BasicExample hasFocus />
      <SchemaExample />
    </>
  );
}

export default TestAutoFocusFirst;
