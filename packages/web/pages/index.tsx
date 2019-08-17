import React from 'react';
import Head from 'next/head';
// import { useRouter } from 'next/router';
import { Text } from '../components/Text';
import { Container } from '../components/Container';
import { BasicExample } from '../components/examples/BasicExample';
import { SchemaExample } from '../components/examples/SchemaExample';

function Index() {
  // const router = useRouter();
  // const focusBasic = router.query.focus === 'basic';
  // const focusSchema = router.query.focus === 'schema';

  return (
    <Container>
      <Head>
        <title>Slad</title>
      </Head>
      <Text size={2}>Slad</Text>
      <BasicExample
        // Do we really need the key?
        // key={`basic-${focusBasic.toString()}`}
        // hasFocus={focusBasic}
        hasFocus={false}
      />
      <SchemaExample
        // key={`schema${focusSchema.toString()}`}
        // hasFocus={focusSchema}
        hasFocus={false}
      />
    </Container>
  );
}

export default Index;
