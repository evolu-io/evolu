import React from 'react';
import { Text } from '../components/Text';
import { Container } from '../components/Container';
import { BasicExample } from '../components/examples/BasicExample';
import { SchemaExample } from '../components/examples/SchemaExample';

function Index() {
  return (
    <Container>
      <Text size={2}>Slad</Text>
      <BasicExample />
      <SchemaExample />
    </Container>
  );
}

export default Index;
