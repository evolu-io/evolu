import React, { useState, useCallback, ReactNode } from 'react';
import {
  Editor,
  EditorValue,
  EditorElement,
  RenderEditorElement,
  useLogEditorValue,
} from 'slad';
import { StandardPropertiesHyphen } from 'csstype';
import { assertNever } from 'assert-never';
import { Text } from '../Text';
import { useStyledJsx } from '../../hooks/useStyledJsx';
import { defaultEditorProps } from './_defaultEditorProps';

// We can describe a schema with TypeScript pretty well.
// Immutablity is enforced via Value once for all. No boring readonly everywhere.
// Runtime validation should be possible with awesome gcanti/io-ts.

// Note there is no special props property. Flat interfaces ftw.
interface SchemaElement extends EditorElement {
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

type CustomValue = EditorValue<SchemaRootElement>;

export function SchemaExample({ hasFocus = false }: { hasFocus?: boolean }) {
  const [editorValue, setEditorValue] = useState<CustomValue>({
    element: {
      type: 'document',
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
    selection: undefined,
    hasFocus,
  });

  const [logEditorValue, logEditorValueElement] = useLogEditorValue(
    editorValue,
  );

  const handleEditorChange = useCallback(
    (value: CustomValue) => {
      logEditorValue(value);
      setEditorValue(value);
    },
    [logEditorValue],
  );

  const getStyledJsx = useStyledJsx();

  const renderElement = useCallback<RenderEditorElement<SchemaRootElement>>(
    (element, children, ref) => {
      const styledJsx = element.style && getStyledJsx(element.style);
      // Because we don't want to render empty class attributes.
      const classNameObject = styledJsx
        ? { className: styledJsx.className }
        : null;

      const renderByType = (): ReactNode => {
        switch (element.type) {
          case 'document':
          case 'heading':
          case 'link':
          case 'list':
          case 'listitem':
          case 'paragraph':
            return (
              <div ref={ref} {...classNameObject}>
                {children}
              </div>
            );
          case 'image':
            return (
              <img
                ref={ref}
                {...classNameObject}
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

  const handleFocusClick = useCallback(() => {
    setEditorValue({ ...editorValue, hasFocus: true });
  }, [editorValue]);

  const handleBlurClick = useCallback(() => {
    setEditorValue({ ...editorValue, hasFocus: false });
  }, [editorValue]);

  return (
    <>
      <Text size={1}>Schema Example</Text>
      <Editor
        {...defaultEditorProps}
        value={editorValue}
        onChange={handleEditorChange}
        renderElement={renderElement}
      />
      {logEditorValueElement}
      <button
        type="button"
        className="focus"
        onClick={handleFocusClick}
        disabled={editorValue.hasFocus}
      >
        focus
      </button>
      <button
        type="button"
        className="blur"
        onClick={handleBlurClick}
        disabled={!editorValue.hasFocus}
      >
        blur
      </button>
    </>
  );
}
