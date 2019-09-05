import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Text } from '../components/Text';
import { Container } from '../components/Container';
import { BasicExample } from '../components/examples/BasicExample';
import { SchemaExample } from '../components/examples/SchemaExample';

function LinkToTest({ name }: { name: string }) {
  return (
    <Link href={`/${name}`}>
      {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
      <a>
        {name}
        <br />
        <style jsx>{`
          a {
            color: #333;
            text-decoration: none;
          }
          a:hover {
            text-decoration: underline;
          }
        `}</style>
      </a>
    </Link>
  );
}

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
      <Text size={1}>Tests</Text>
      <Text>
        <LinkToTest name="testAutoFocusBoth" />
        <LinkToTest name="testAutoFocusFirst" />
        <LinkToTest name="testAutoFocusSecond" />
        <LinkToTest name="testNormalizeEditorElement" />
        <LinkToTest name="testRenderer" />
        <LinkToTest name="testRenderReactDOMElement" />
        <LinkToTest name="testSelection" />
        <LinkToTest name="testSelectionHasFocusNoSelection" />
        <LinkToTest name="testSelectionNoFocusNoSelection" />
        <LinkToTest name="testSelectionNoFocusSomeSelection" />
        <LinkToTest name="testTabKeyAndFocusBlurClick" />
        <LinkToTest name="testWriting" />
      </Text>
    </Container>
  );
}

export default Index;
