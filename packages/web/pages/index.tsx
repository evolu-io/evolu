import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { selection } from 'evolu';
import { toNullable } from 'fp-ts/lib/Option';
import { Text } from '../components/Text';
import { Container } from '../components/Container';
import { BasicExample } from '../components/examples/BasicExample';
import { SchemaExample } from '../components/examples/SchemaExample';

const LinkToTest = ({ name }: { name: string }) => {
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
};

const Index = () => {
  return (
    <Container>
      <Head>
        <title>Evolu</title>
      </Head>
      <Text size={2}>Evolu</Text>
      <BasicExample
        autoFocus
        initialSelection={toNullable(
          selection({ anchor: [0, 0, 0], focus: [0, 0, 2] }),
        )}
      />
      <SchemaExample />
      <Text size={1}>Tests</Text>
      <Text>
        <LinkToTest name="testAutoFocusBoth" />
        <LinkToTest name="testAutoFocusFirst" />
        <LinkToTest name="testAutoFocusSecond" />
        <LinkToTest name="testEditorServer" />
        <LinkToTest name="testNormalizeEditorElement" />
        <LinkToTest name="testSelection" />
        <LinkToTest name="testSelectionHasFocusNoSelection" />
        <LinkToTest name="testSelectionNoFocusNoSelection" />
        <LinkToTest name="testSelectionNoFocusSomeSelection" />
        <LinkToTest name="testSetValue" />
        <LinkToTest name="testSSR" />
        <LinkToTest name="testTabKeyAndFocusBlurClick" />
        <LinkToTest name="testWriting" />
        <LinkToTest name="testWritingRich" />
      </Text>
    </Container>
  );
};

export default Index;
