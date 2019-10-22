import React from 'react';
import { BasicExample } from '../components/examples/BasicExample';
import { SchemaExample } from '../components/examples/SchemaExample';

const TestSSR = () => {
  return (
    <>
      <BasicExample />
      <SchemaExample />
    </>
  );
};

export default TestSSR;
