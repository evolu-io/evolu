import React from 'react';
import { BasicExample } from '../components/examples/BasicExample';
import { SchemaExample } from '../components/examples/SchemaExample';

function TestSSR() {
  return (
    <>
      <BasicExample />
      <SchemaExample />
    </>
  );
}

export default TestSSR;
