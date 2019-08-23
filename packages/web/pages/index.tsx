import React from 'react';
import Head from 'next/head';
import { Text } from '../components/Text';
import { Container } from '../components/Container';
import { BasicExample } from '../components/examples/BasicExample';
import { SchemaExample } from '../components/examples/SchemaExample';

function Index() {
  return (
    <Container>
      <Head>
        <title>Slad</title>
      </Head>
      <Text size={2}>Slad</Text>
      <BasicExample
        autoFocus
        initialSelection={{ anchor: [0, 0, 0], focus: [0, 0, 2] }}
      />
      <SchemaExample />
    </Container>
  );
}

export default Index;
