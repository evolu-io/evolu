import React from 'react';
import { Container } from '../components/Container';
import { BasicExample } from '../components/examples/BasicExample';
import { SchemaExample } from '../components/examples/SchemaExample';

function Index() {
  return (
    <Container>
      <BasicExample />
      <SchemaExample hasFocus />
    </Container>
  );
}

export default Index;
