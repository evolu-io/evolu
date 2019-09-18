import React, { useState, useCallback, ReactNode } from 'react';
import {
  createEditorState,
  Editor,
  EditorElement,
  EditorSelection,
  EditorState,
  EditorText,
  RenderEditorElement,
  useLogEditorState,
  id,
} from 'slad';
import { StandardPropertiesHyphen } from 'csstype';
import { assertNever } from 'assert-never';
import { Text } from '../Text';
import { useStyledJsx } from '../../hooks/useStyledJsx';
import { defaultEditorProps } from './_defaultEditorProps';

// We can describe a schema with TypeScript pretty well.
// Runtime validation should be possible with awesome gcanti/io-ts.

interface SchemaElement extends EditorElement {
  type: string;
  // For css-in-js via styled-jsx, foo-bla is better than fooBla.
  style?: StandardPropertiesHyphen;
  children: (SchemaElement | EditorText)[];
}

// For images and the other void elements.
interface SchemaVoidElement extends SchemaElement {
  children: [];
}

interface SchemaHeadingElement extends SchemaElement {
  type: 'heading';
  // Just one text.
  children: [EditorText];
}

interface SchemaLinkElement extends SchemaElement {
  type: 'link';
  href: string;
  // Just one text.
  children: [EditorText];
}

type SchemaParagraphElementChild = EditorText | SchemaLinkElement;

interface SchemaParagraphElement extends SchemaElement {
  type: 'paragraph';
  // At least one child.
  children: [SchemaParagraphElementChild, ...(SchemaParagraphElementChild)[]];
}

interface SchemaListItemElement extends SchemaElement {
  type: 'listitem';
  // Just one text or text with SchemaListElement.
  children: [EditorText] | [EditorText, SchemaListElement];
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

type SchemaEditorState = EditorState<SchemaDocumentElement>;

// Exported for testEditorServer.
export const initialEditorState = createEditorState<SchemaEditorState>({
  element: {
    id: id(),
    type: 'document',
    children: [
      {
        id: id(),
        type: 'heading',
        style: { 'font-size': '24px' },
        children: [{ id: id(), text: 'heading' }],
      },
      {
        id: id(),
        type: 'paragraph',
        style: { 'font-size': '16px' },
        children: [{ id: id(), text: 'paragraph' }],
      },
      {
        id: id(),
        type: 'list',
        style: { margin: '16px' },
        children: [
          {
            id: id(),
            type: 'listitem',
            style: { 'font-size': '16px' },
            children: [
              { id: id(), text: 'listitem' },
              // List can be nested. With type checking of course.
              // {
              //   type: 'list',
              //   children: [
              //     {
              //       type: 'listitem',
              //       children: [{ text: 'nested' }],
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
export function useSchemaRenderElement() {
  const getStyledJsx = useStyledJsx();

  const renderElement = useCallback<RenderEditorElement>(
    (editorElement, children, ref) => {
      // Recursive ThisAndChildTypes<SchemaDocumentElement> can only by finite.
      // Therefore, we prefer explicit union type.
      // https://github.com/microsoft/TypeScript/pull/33050#issuecomment-529683091
      // TODO: There is a new hint, maybe i will be possible. Wait for TS 3.7.
      const element = editorElement as
        | SchemaDocumentElement
        | SchemaHeadingElement
        | SchemaImageElement
        | SchemaLinkElement
        | SchemaListElement
        | SchemaListItemElement
        | SchemaParagraphElement;

      const styledJsx = getStyledJsx(element.style || {});

      const renderByType = (): ReactNode => {
        switch (element.type) {
          case 'document':
          case 'heading':
          case 'link':
          case 'list':
          case 'listitem':
          case 'paragraph':
            return (
              <div ref={ref} className={styledJsx.className}>
                {children}
              </div>
            );
          case 'image':
            return (
              <img
                ref={ref}
                className={styledJsx.className}
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
          {styledJsx.styles}
        </>
      );
    },
    [getStyledJsx],
  );

  return renderElement;
}

export function SchemaExample({
  autoFocus = false,
  initialSelection = null,
}: {
  autoFocus?: boolean;
  initialSelection?: EditorSelection | null;
}) {
  const [editorState, setEditorState] = useState({
    ...initialEditorState,
    ...(autoFocus != null && { hasFocus: autoFocus }),
    ...(initialSelection != null && { selection: initialSelection }),
  });

  const [logEditorState, logEditorStateElement] = useLogEditorState(
    editorState,
  );

  const handleEditorChange = useCallback(
    (editorState: SchemaEditorState) => {
      // logEditorState is here and not in an useEffect, because we
      // want to log all onChange calls, even with identical values.
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
      <Editor
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
