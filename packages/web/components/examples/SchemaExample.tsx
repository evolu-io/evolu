import React, { useState, useCallback, ReactNode } from 'react';
import { Editor, Value, Element, RenderElement } from 'slad';
import { StandardPropertiesHyphen } from 'csstype';
import { assertNever } from 'assert-never';
import { Text } from '../Text';
import { useStyledJsx } from '../../hooks/useStyledJsx';
import { SelectionToJsonString } from '../SelectionToJsonString';

// It seems we can describe a schema with TypeScript pretty well.
// Immutablity is enforced via SladValue once for all. No boring readonly everywhere.
// Runtime validation should be possible with awesome gcanti/io-ts.

// Note there is no special props property. Flat interfaces ftw.
interface SchemaElement extends Element {
  type: string;
  // For css-in-js, foo-bla is better than inline fooBla style.
  style?: StandardPropertiesHyphen;
  children?: (SchemaElement | string)[] | undefined;
}

// For images and the other void elements.
interface SchemaVoidElement extends SchemaElement {
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
  // At least one child.
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

interface SchemaRootElement extends SchemaElement {
  type: 'document';
  children: (
    | SchemaHeadingElement
    | SchemaParagraphElement
    | SchemaListElement
    | SchemaImageElement)[];
}

type CustomValue = Value<SchemaRootElement>;

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
            children: [
              'listitem',
              // List can be nested. With type checking of course.
              // {
              //   type: 'list',
              //   children: [
              //     {
              //       type: 'listitem',
              //       children: ['nested'],
              //     },
              //   ],
              // },
            ],
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

  const renderElement = useCallback<RenderElement<SchemaRootElement>>(
    (element, children, ref) => {
      const styledJsx = element.style && getStyledJsx(element.style);
      const className = styledJsx ? styledJsx.className : '';

      const renderByType = (): ReactNode => {
        switch (element.type) {
          case 'document':
          case 'heading':
          case 'link':
          case 'list':
          case 'listitem':
          case 'paragraph':
            return (
              <div ref={ref} className={className}>
                {children}
              </div>
            );
          case 'image':
            return (
              <img
                ref={ref}
                className={className}
                src={element.src}
                alt={element.alt}
                width={element.width}
                height={element.height}
              />
            );
          default:
            assertNever(element);
        }
      };

      return (
        <>
          {renderByType()}
          {styledJsx && styledJsx.styles}
        </>
      );
    },
    [getStyledJsx],
  );

  return (
    <>
      <Text>Custom Element</Text>
      <Editor
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
