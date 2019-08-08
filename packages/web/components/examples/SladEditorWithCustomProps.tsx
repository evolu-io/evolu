import React, { useState, useCallback, useMemo } from 'react';
import { SladEditor, SladValue, RenderElement } from 'slad';
import { StandardPropertiesHyphen } from 'csstype';
import css from 'styled-jsx/css';
import { Text } from '../Text';

// We can use custom props for anything.
interface CustomProps {
  style: StandardPropertiesHyphen;
}

type CustomValue = SladValue<CustomProps>;

const initialState: CustomValue = {
  element: {
    props: {
      style: { 'background-color': '#ccc' },
    },
    children: [
      {
        props: {
          style: { 'font-size': '24px' },
        },
        children: [{ type: 'text', value: 'heading 1' }],
      },
      {
        props: {
          style: { 'font-size': '16px' },
        },
        children: [{ type: 'text', value: 'paragraph' }],
      },
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

export function SladEditorWithCustomProps() {
  const [editorValue, setEditorValue] = useState<CustomValue>(initialState);

  const handleSladEditorChange = useCallback((value: CustomValue) => {
    setEditorValue(value);
  }, []);

  const getStyledJsx = useStyledJsx();

  const renderElement = useCallback<RenderElement<CustomProps>>(
    (prop, children, ref) => {
      const { className, styleElement } = getStyledJsx(prop.style);
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
      <Text>Editor with custom props</Text>
      <SladEditor<CustomProps>
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
