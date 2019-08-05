import React from 'react';
import { Text } from '../components/Text';
import { Container } from '../components/Container';
import { SladEditorWithDefaultProps } from '../components/examples/SladEditorWithDefaultProps';
import { SladEditorWithCustomProps } from '../components/examples/SladEditorWithCustomProps';

function Index() {
  return (
    <Container>
      <Text size={2}>Slad</Text>
      <Text>TODO: Everything</Text>
      <SladEditorWithDefaultProps />
      <SladEditorWithCustomProps />
    </Container>
  );
}

export default Index;
