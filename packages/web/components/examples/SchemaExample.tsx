import React, { useState, useCallback, ReactNode } from 'react';
import {
  Editor,
  EditorState,
  EditorElement,
  RenderEditorElement,
  useLogEditorState,
  EditorSelection,
  createCustomEditorState,
} from 'slad';
import { StandardPropertiesHyphen } from 'csstype';
import { Text } from '../Text';
import { useStyledJsx } from '../../hooks/useStyledJsx';
import { defaultEditorProps } from './_defaultEditorProps';

// We can describe a schema with TypeScript pretty well.
// Immutablity is enforced via EditorState once for all.
// Runtime validation should be possible with awesome gcanti/io-ts.

// Note there is no special props property. Flat interfaces can be extended better.
interface SchemaElement extends EditorElement {
  type: string;
  // For css-in-js, foo-bla is better than inline fooBla style.
  style?: StandardPropertiesHyphen;
  children: (SchemaElement | string)[];
}

// For images and the other void elements.
interface SchemaVoidElement extends SchemaElement {
  children: [];
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

type SchemaEditorState = EditorState<SchemaRootElement>;

export const initialSchemaRootElement: SchemaRootElement = {
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
      children: [],
    },
  ],
};

export function useSchemaRenderElement() {
  const getStyledJsx = useStyledJsx();

  return useCallback<RenderEditorElement<SchemaRootElement>>(
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
          default: {
            // https://github.com/steida/slad/issues/28
            // assertNever(element);
          }
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
}

export function SchemaExample({
  autoFocus = false,
  initialSelection = null,
}: {
  autoFocus?: boolean;
  initialSelection?: EditorSelection | null;
}) {
  const [editorState, setEditorState] = useState(
    createCustomEditorState<SchemaRootElement>({
      element: initialSchemaRootElement,
      hasFocus: autoFocus,
      selection: initialSelection,
    }),
  );

  const [logEditorState, logEditorStateElement] = useLogEditorState(
    editorState,
  );

  const handleEditorChange = useCallback(
    (editorState: SchemaEditorState) => {
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
