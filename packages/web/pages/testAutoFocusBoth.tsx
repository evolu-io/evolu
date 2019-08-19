import React from 'react';
import { BasicExample } from '../components/examples/BasicExample';
import { SchemaExample } from '../components/examples/SchemaExample';

function TestAutoFocusBoth() {
  return (
    <>
      <BasicExample hasFocus />
      <SchemaExample hasFocus />
    </>
  );
}

export default TestAutoFocusBoth;
