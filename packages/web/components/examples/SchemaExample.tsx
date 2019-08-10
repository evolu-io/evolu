import React, { useState, useCallback, useMemo } from 'react';
import { SladEditor, SladValue, SladElement, RenderElement } from 'slad';
import { StandardPropertiesHyphen } from 'csstype';
import css from 'styled-jsx/css';
import { Text } from '../Text';

interface SchemaElement extends SladElement {
  readonly type: string;
  readonly props: {
    // Replace fooBla with foo-bla.
    readonly style: StandardPropertiesHyphen;
  };
  readonly children?: readonly (SchemaElement | string)[] | null;
}

interface SchemaHeadingElement extends SchemaElement {
  readonly type: 'heading';
  // Just one string.
  readonly children: readonly [string];
}

interface SchemaLinkElement extends SchemaElement {
  readonly type: 'link';
  readonly href: string;
  // Just one string.
  readonly children: readonly [string];
}

interface SchemaParagraphElement extends SchemaElement {
  readonly type: 'paragraph';
  // We can not use such tuple. Probably because Next.js or Webpack.
  // Rest element must be last element (33:37)
  // At least one SchemaLinkElement or string.
  // readonly children: [
  //   SchemaLinkElement | string,
  //   ...(SchemaLinkElement | string)[],
  // ];
  readonly children: (SchemaLinkElement | string)[];
}

interface SchemaListItemElement extends SchemaElement {
  readonly type: 'listitem';
  // Just one string or string with another SchemaListElement.
  readonly children: [string] | [string, SchemaListElement];
}

interface SchemaListElement extends SchemaElement {
  readonly type: 'list';
  readonly children: SchemaListItemElement[];
}

interface SchemaImageElement extends SchemaElement {
  readonly type: 'image';
  readonly src: string;
  // Enforce no children
  readonly children: null;
}

interface SchemaDocumentElement extends SchemaElement {
  readonly type: 'document';
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
    props: {
      style: { 'background-color': '#ccc' },
    },
    children: [
      {
        type: 'heading',
        props: {
          style: { 'font-size': '24px' },
        },
        children: ['heading'],
      },
      {
        type: 'paragraph',
        props: {
          style: { 'font-size': '16px' },
        },
        children: ['paragraph'],
      },
      // TODO: Wtf?
      // {
      //   type: 'list',
      //   props: {
      //     style: { 'font-size': '16px' },
      //   },
      //   children: [{ type: 'listitem', children: ['item'] }],
      // },
    ],
  },
};

// Leverage styled-jsx for custom style rendering.
const useStyledJsx = () => {
  // TODO: Consider caching resolved styles with WeakMap and useRef.
  const getStyledJsx = useCallback((style: StandardPropertiesHyphen) => {
    const styleString = Object.keys(style)
      .reduce<string[]>((array, prop) => {
        // @ts-ignore I don't know. Probably prop should be restricted string.
        const value = style[prop];
        return [...array, `${prop}: ${value}`];
      }, [])
      .join(';');
    // css.resolve does not add vendor prefixes, but that's fine,
    // modern browsers don't need them.
    const { className, styles: styleElement } = css.resolve`
      ${styleString}
    `;
    return { className, styleElement };
  }, []);
  return getStyledJsx;
};

export function SchemaExample() {
  const [editorValue, setEditorValue] = useState<CustomValue>(initialState);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSladEditorChange = useCallback((value: CustomValue) => {
    setEditorValue(value);
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getStyledJsx = useStyledJsx();

  const renderElement = useCallback<RenderElement>(
    (element, children, ref) => {
      // TODO: Type guard for CustomElement, or something better.
      // @ts-ignore
      const { className, styleElement } = getStyledJsx(element.props.style);
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
      <pre>
        selection:{' '}
        {useMemo(() => JSON.stringify(editorValue.selection), [
          editorValue.selection,
        ])}
      </pre>
    </>
  );
}
