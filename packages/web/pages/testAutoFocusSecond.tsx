import React from 'react';
import { BasicExample } from '../components/examples/BasicExample';
import { SchemaExample } from '../components/examples/SchemaExample';

const TestAutoFocusSecond = () => {
  return (
    <>
      <BasicExample />
      <SchemaExample autoFocus />
    </>
  );
};

export default TestAutoFocusSecond;
