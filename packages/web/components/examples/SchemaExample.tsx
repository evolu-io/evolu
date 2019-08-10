import React, { useState, useCallback } from 'react';
import { SladEditor, SladValue, SladElement, RenderElement } from 'slad';
import { StandardPropertiesHyphen } from 'csstype';
import { Text } from '../Text';
import { useStyledJsx } from '../../hooks/useStyledJsx';
import { SelectionToJsonString } from '../SelectionToJsonString';

// It seems we can describe a schema with TypeScript pretty well.
// Immutablity is enforced via SladValue once for all. No boring readonly everywhere.
// Runtime validation should be possible with awesome gcanti/io-ts.

// Always extends from SladElement
interface SchemaElement extends SladElement {
  type: string;
  // Note there is no special props property. Props are spread. It's better for DX.
  // For css-in-js, foo-bla is better than inline fooBla style.
  style?: StandardPropertiesHyphen;
  children?: (SchemaElement | string)[] | undefined;
}

// For images and the other void elements.
interface SchemaVoidElement extends SladElement {
  children: undefined;
}

interface SchemaHeadingElement extends SchemaElement {
  type: 'heading';
  // Just one string.
  children: [string];
}

interface SchemaLinkElement extends SchemaElement {
  type: 'link';
  href: string;
  // Just one string.
  children: [string];
}

type SchemaParagraphElementChild = string | SchemaLinkElement;

interface SchemaParagraphElement extends SchemaElement {
  type: 'paragraph';
  // At least one SchemaLinkElement or string.
  children: [SchemaParagraphElementChild, ...(SchemaParagraphElementChild)[]];
}

interface SchemaListItemElement extends SchemaElement {
  type: 'listitem';
  // Just one string or string with another SchemaListElement.
  children: [string] | [string, SchemaListElement];
}

interface SchemaListElement extends SchemaElement {
  type: 'list';
  children: SchemaListItemElement[];
}

interface SchemaImageElement extends SchemaVoidElement {
  type: 'image';
  src: string;
  alt: string;
  width: number;
  height: number;
}

interface SchemaDocumentElement extends SchemaElement {
  type: 'document';
  children: (
    | SchemaHeadingElement
    | SchemaParagraphElement
    | SchemaListElement
    | SchemaImageElement)[];
}

type CustomValue = SladValue<SchemaDocumentElement>;

const initialState: CustomValue = {
  element: {
    type: 'document',
    style: { 'background-color': '#ccc' },
    children: [
      {
        type: 'heading',
        style: { 'font-size': '24px' },
        children: ['heading'],
      },
      {
        type: 'paragraph',
        style: { 'font-size': '16px' },
        children: ['paragraph'],
      },
      {
        type: 'list',
        style: { margin: '16px' },
        children: [
          {
            type: 'listitem',
            style: { 'font-size': '16px' },
            children: ['listitem'],
          },
        ],
      },
      {
        type: 'image',
        src: 'https://via.placeholder.com/80',
        alt: 'Square placeholder image 80px',
        width: 80,
        height: 80,
        children: undefined,
      },
    ],
  },
};

export function SchemaExample() {
  const [editorValue, setEditorValue] = useState<CustomValue>(initialState);

  const handleSladEditorChange = useCallback((value: CustomValue) => {
    setEditorValue(value);
  }, []);

  const getStyledJsx = useStyledJsx();

  const renderElement = useCallback<RenderElement>(
    (element, children, ref) => {
      // TODO: Exhausive switch with assert never on union of all elements.
      // @ts-ignore
      if (element.src)
        return (
          <img
            // @ts-ignore
            src={element.src}
            // @ts-ignore
            alt={element.alt}
            // @ts-ignore
            width={element.width}
            // @ts-ignore
            height={element.height}
            ref={ref}
          />
        );
      // @ts-ignore
      const { className, styleElement } = getStyledJsx(element.style);
      return (
        <div className={className} ref={ref}>
          {children}
          {styleElement}
        </div>
      );
    },
    [getStyledJsx],
  );

  return (
    <>
      <Text>Custom Element</Text>
      <SladEditor
        value={editorValue}
        onChange={handleSladEditorChange}
        renderElement={renderElement}
        autoCorrect="off" // Disable browser autoCorrect.
        spellCheck={false} // Disable browser spellCheck.
        data-gramm // Disable Grammarly Chrome extension.
        style={{ width: 300, marginBottom: 24 }}
      />
      <SelectionToJsonString value={editorValue.selection} />
    </>
  );
}
