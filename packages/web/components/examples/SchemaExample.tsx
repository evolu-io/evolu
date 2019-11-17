import { css, SerializedStyles } from '@emotion/core';
import {
  Element,
  Selection,
  Text,
  createValue,
  id,
  RenderElement,
  Value,
  useLogValue,
  Editor,
} from 'evolu';
import { absurd } from 'fp-ts/lib/function';
import React, { ReactNode, useCallback, useState } from 'react';
import { fromNullable } from 'fp-ts/lib/Option';
import { Text as AppText } from '../Text';
import { defaultEditorProps } from './_defaultEditorProps';

// We can describe a schema with TypeScript pretty well.
// Runtime validation should be possible with awesome gcanti/io-ts.

interface SchemaElement extends Element {
  type: string;
  children: (SchemaElement | Text)[];
}

// For images and the other void elements.
interface SchemaVoidElement extends SchemaElement {
  children: [];
}

interface SchemaHeadingElement extends SchemaElement {
  type: 'heading';
  // Just one text.
  children: [Text];
}

interface SchemaLinkElement extends SchemaElement {
  type: 'link';
  href: string;
  // Just one text.
  children: [Text];
}

type SchemaParagraphElementChild = Text | SchemaLinkElement;

interface SchemaParagraphElement extends SchemaElement {
  type: 'paragraph';
  // At least one child.
  children: [SchemaParagraphElementChild, ...SchemaParagraphElementChild[]];
}

interface SchemaListItemElement extends SchemaElement {
  type: 'listitem';
  // Just one text or text with SchemaListElement.
  children: [Text] | [Text, SchemaListElement];
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

export interface SchemaDocumentElement extends SchemaElement {
  type: 'document';
  children: (
    | SchemaHeadingElement
    | SchemaParagraphElement
    | SchemaListElement
    | SchemaImageElement
  )[];
}

// Exported for testEditorServer.
export const initialValue = createValue<SchemaDocumentElement>({
  element: {
    id: id(),
    type: 'document',
    children: [
      {
        id: id(),
        type: 'heading',
        children: ['heading'],
      },
      {
        id: id(),
        type: 'paragraph',
        children: ['paragraph'],
      },
      {
        id: id(),
        type: 'list',
        children: [
          {
            id: id(),
            type: 'listitem',
            children: [
              'listitem',
              // List can be nested. With recursive type checking of course.
              // {
              //   id: id(),
              //   type: 'list',
              //   children: [
              //     {
              //       id: id(),
              //       type: 'listitem',
              //       children: [{ id: id(), text: 'nested' }],
              //     },
              //   ],
              // },
            ],
          },
        ],
      },
      {
        id: id(),
        type: 'image',
        src: 'https://via.placeholder.com/80',
        alt: 'Square placeholder image 80px',
        width: 80,
        height: 80,
        children: [],
      },
    ],
  },
});

// Exported for testEditorServer.
export const useSchemaRenderElement = () => {
  const renderElement = useCallback<RenderElement>(
    (editorElement, children, ref) => {
      // This is how we can leverage assertNever.
      const element = editorElement as
        | SchemaDocumentElement
        | SchemaHeadingElement
        | SchemaImageElement
        | SchemaLinkElement
        | SchemaListElement
        | SchemaListItemElement
        | SchemaParagraphElement;

      const renderByType = (): ReactNode => {
        switch (element.type) {
          case 'document':
          case 'heading':
          case 'link':
          case 'list':
          case 'listitem':
          case 'paragraph': {
            // This is just an example.
            const elementCSS: { [key: string]: SerializedStyles } = {
              heading: css({ fontSize: '24px' }),
              paragraph: css({ fontSize: '16px' }),
              list: css({ margin: '16px' }),
            };
            return (
              <div ref={ref} css={elementCSS[element.type] || {}}>
                {children}
              </div>
            );
          }
          case 'image':
            return (
              <img
                ref={ref}
                src={element.src}
                alt={element.alt}
                width={element.width}
                height={element.height}
              />
            );
          default:
            absurd(element);
        }
      };

      return renderByType();
    },
    [],
  );

  return renderElement;
};

export const SchemaExample = ({
  autoFocus = false,
  initialSelection = null,
}: {
  autoFocus?: boolean;
  initialSelection?: Selection | null;
}) => {
  const [value, setValue] = useState<Value>({
    ...initialValue,
    hasFocus: autoFocus,
    selection: fromNullable(initialSelection),
  });

  const [logValue, logValueElement] = useLogValue(value);

  const handleEditorChange = useCallback(
    (value: Value) => {
      logValue(value);
      setValue(value);
    },
    [logValue],
  );

  const handleFocusClick = useCallback(() => {
    handleEditorChange({ ...value, hasFocus: true });
  }, [value, handleEditorChange]);

  const handleBlurMouseDown = useCallback(
    (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      event.preventDefault();
      handleEditorChange({ ...value, hasFocus: false });
    },
    [value, handleEditorChange],
  );

  const renderElement = useSchemaRenderElement();

  return (
    <>
      <AppText size={1}>Schema Example</AppText>
      <Editor
        {...defaultEditorProps}
        value={value}
        onChange={handleEditorChange}
        renderElement={renderElement}
      />
      {logValueElement}
      <div style={{ marginBottom: 24 }}>
        <button
          type="button"
          className="focus"
          onClick={handleFocusClick}
          tabIndex={value.hasFocus ? 0 : -1}
          disabled={value.hasFocus}
        >
          focus
        </button>
        <button
          type="button"
          className="blur"
          // Do not steal focus. Force blur.
          onMouseDown={handleBlurMouseDown}
          tabIndex={!value.hasFocus ? 0 : -1}
          disabled={!value.hasFocus}
        >
          blur
        </button>
      </div>
    </>
  );
};
