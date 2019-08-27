import React, { ReactNode, createElement } from 'react';
import {
  // EditorElement,
  // DeepFiniteNestedUnion,
  EditorReactDOMElement,
} from '../models/element';

// export type RenderElement<T extends EditorElement> = (
//   element: DeepFiniteNestedUnion<T>,
//   children: ReactNode,
// ) => ReactNode;

export const renderReactDOMElement = (
  element: EditorReactDOMElement,
  children: ReactNode,
) => {
  return createElement(element.tag || 'div', element.props, children);
};

export interface RendererProps {
  element: EditorReactDOMElement;
  // renderElement: RenderElement<EditorReactDOMElement>;
}

/**
 * Just render. No edit behaviour. Good for performance and tree shaking.
 */
export function Renderer({ element }: RendererProps) {
  const children =
    element.children &&
    element.children.map((child, index) => {
      if (typeof child === 'string') return child;
      // Index is ok for value type.
      // eslint-disable-next-line react/no-array-index-key
      return <Renderer element={child} key={index} />;
    });
  return renderReactDOMElement(element, children);
}
