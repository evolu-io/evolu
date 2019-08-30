import React, { createElement } from 'react';
import { RenderEditorElement, EditorReactDOMElement } from '../models/element';

export interface RendererProps<T> {
  element: T;
  renderElement?: RenderEditorElement<T>;
}

/**
 * Just render. No edit behaviour. Good for performance and tree shaking.
 */
export function Renderer<T extends EditorReactDOMElement>({
  element,
  renderElement,
}: RendererProps<T>) {
  const children =
    element.children &&
    element.children.map((child, index) => {
      if (typeof child === 'string') {
        return child.length === 0 ? (
          <br
            // Index is ok for value type.
            // eslint-disable-next-line react/no-array-index-key
            key={index}
          />
        ) : (
          child
        );
      }
      return (
        <Renderer
          element={child}
          renderElement={
            renderElement as
              | RenderEditorElement<EditorReactDOMElement>
              | undefined
          }
          // Index is ok for value type.
          // eslint-disable-next-line react/no-array-index-key
          key={index}
        />
      );
    });
  if (renderElement) return <>{renderElement(element, children, () => {})}</>;
  // It seems nobody knows how to make nested union from ReactDOM type.
  // https://github.com/DefinitelyTyped/DefinitelyTyped/issues/21651
  // @ts-ignore createElement nor EditorReactDOMElement types are correct.
  return createElement(element.tag || 'div', element.props, children);
}
