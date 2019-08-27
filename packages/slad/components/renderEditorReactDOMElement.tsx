import { createElement } from 'react';
import { EditorReactDOMElement, RenderEditorElement } from '../models/element';

export const renderEditorReactDOMElement: RenderEditorElement<
  EditorReactDOMElement
> = (element, children, ref) => {
  return createElement(
    element.tag || 'div',
    { ...element.props, ref },
    children,
  );
};
