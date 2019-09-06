import React from 'react';
import { BasicExample } from '../components/examples/BasicExample';

function TestWriting() {
  return (
    <BasicExample initialElement={{ children: [{ text: 'a' }] }} autoFocus />
  );
}

export default TestWriting;
