import React, { useEffect } from 'react';
import { BasicExample } from '../components/examples/BasicExample';
import { SchemaExample } from '../components/examples/SchemaExample';

const TestAutoFocusFirst = () => {
  useEffect(() => {
    setTimeout(() => {
      // eslint-disable-next-line no-alert, no-undef
      window.alert('foo');
    }, 50);
  }, []);
  return (
    <>
      <BasicExample autoFocus />
      <SchemaExample />
    </>
  );
};

export default TestAutoFocusFirst;
