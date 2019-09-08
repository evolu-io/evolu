import { createElement, Children } from 'react';
import { EditorDOMElement, RenderEditorElement } from '../models/element';

export const renderEditorDOMElement: RenderEditorElement<EditorDOMElement> = (
  element,
  children,
  ref,
) => {
  // TODO: renderEditorDOMElement should warn abour naked spans which are tricky.
  // https://github.com/facebook/draft-js/blob/dc58df8219fdc1e12ce947877d103b595682efa9/src/component/contents/DraftEditorTextNode.react.js#L33
  // This issue is real, but not for us because Editor does not use SPAN wrappers.
  // But some generated EditorDOMElement can use it, so renderEditorDOMElement should warn.

  // To bypass React void elements invariant violation.
  if (Children.count(children) === 0) {
    return createElement(element.tag, { ...element.props, ref });
  }
  return createElement(element.tag, { ...element.props, ref }, children);
};
