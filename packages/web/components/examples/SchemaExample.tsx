import React, { useState, useCallback, ReactNode } from 'react';
import * as editor from 'slad';
import { css, SerializedStyles } from '@emotion/core';
import { absurd } from 'fp-ts/lib/function';
import { some } from 'fp-ts/lib/Option';
import { Text } from '../Text';
import { defaultEditorProps } from './_defaultEditorProps';

// We can describe a schema with TypeScript pretty well.
// Runtime validation should be possible with awesome gcanti/io-ts.

interface SchemaElement extends editor.EditorElement {
  type: string;
  children: (SchemaElement | editor.EditorText)[];
}

// For images and the other void elements.
interface SchemaVoidElement extends SchemaElement {
  children: [];
}

interface SchemaHeadingElement extends SchemaElement {
  type: 'heading';
  // Just one text.
  children: [editor.EditorText];
}

interface SchemaLinkElement extends SchemaElement {
  type: 'link';
  href: string;
  // Just one text.
  children: [editor.EditorText];
}

type SchemaParagraphElementChild = editor.EditorText | SchemaLinkElement;

interface SchemaParagraphElement extends SchemaElement {
  type: 'paragraph';
  // At least one child.
  children: [SchemaParagraphElementChild, ...(SchemaParagraphElementChild)[]];
}

interface SchemaListItemElement extends SchemaElement {
  type: 'listitem';
  // Just one text or text with SchemaListElement.
  children: [editor.EditorText] | [editor.EditorText, SchemaListElement];
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
    | SchemaImageElement)[];
}

// Exported for testEditorServer.
export const initialEditorState = editor.createEditorState<
  SchemaDocumentElement
>({
  element: {
    id: editor.id(),
    type: 'document',
    children: [
      {
        id: editor.id(),
        type: 'heading',
        children: [{ id: editor.id(), text: 'heading' }],
      },
      {
        id: editor.id(),
        type: 'paragraph',
        children: [{ id: editor.id(), text: 'paragraph' }],
      },
      {
        id: editor.id(),
        type: 'list',
        children: [
          {
            id: editor.id(),
            type: 'listitem',
            children: [
              { id: editor.id(), text: 'listitem' },
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
        id: editor.id(),
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
export function useSchemaRenderElement() {
  const renderElement = useCallback<editor.RenderEditorElement>(
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
}

export function SchemaExample({
  autoFocus = false,
  initialSelection = null,
}: {
  autoFocus?: boolean;
  initialSelection?: editor.EditorSelection | null;
}) {
  const [editorState, setEditorState] = useState({
    ...initialEditorState,
    ...(autoFocus != null && { hasFocus: autoFocus }),
    ...(initialSelection != null && { selection: some(initialSelection) }),
  });

  const [logEditorState, logEditorStateElement] = editor.useLogEditorState(
    editorState,
  );

  const handleEditorChange = useCallback(
    (editorState: editor.EditorState) => {
      logEditorState(editorState);
      setEditorState(editorState);
    },
    [logEditorState],
  );

  const handleFocusClick = useCallback(() => {
    handleEditorChange({ ...editorState, hasFocus: true });
  }, [editorState, handleEditorChange]);

  const handleBlurMouseDown = useCallback(
    (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      event.preventDefault();
      handleEditorChange({ ...editorState, hasFocus: false });
    },
    [editorState, handleEditorChange],
  );

  const renderElement = useSchemaRenderElement();

  return (
    <>
      <Text size={1}>Schema Example</Text>
      <editor.Editor
        {...defaultEditorProps}
        editorState={editorState}
        onChange={handleEditorChange}
        renderElement={renderElement}
      />
      {logEditorStateElement}
      <div style={{ marginBottom: 24 }}>
        <button
          type="button"
          className="focus"
          onClick={handleFocusClick}
          tabIndex={editorState.hasFocus ? 0 : -1}
          disabled={editorState.hasFocus}
        >
          focus
        </button>
        <button
          type="button"
          className="blur"
          // Do not steal focus. Force blur.
          onMouseDown={handleBlurMouseDown}
          tabIndex={!editorState.hasFocus ? 0 : -1}
          disabled={!editorState.hasFocus}
        >
          blur
        </button>
      </div>
    </>
  );
}
