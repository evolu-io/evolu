import React from 'react';
import invariant from 'tiny-invariant';
import { RenderElement } from '../contexts/RenderElementContext';
import { Element, DivElement } from '../models/element';

// It should be possible to enforce this via types only, but TypeScript errors
// can be confusing, so it's good to have nice dev warning.
export function isGoodEnoughDivElement(
  element: Element,
): element is DivElement {
  // https://overreacted.io/how-does-the-development-mode-work/
  if (process.env.NODE_ENV !== 'production') {
    const div = element as DivElement;
    return (
      typeof div.props === 'object' &&
      (div.props.style || div.props.className) != null
    );
  }
  return true;
}

export const renderDivElement: RenderElement<DivElement> = (
  element,
  children,
  ref,
) => {
  if (!isGoodEnoughDivElement(element)) {
    // https://overreacted.io/how-does-the-development-mode-work/
    if (process.env.NODE_ENV !== 'production') {
      invariant(
        false,
        'DivElement props has to have at least className or style prop. Or pass custom renderElement to Editor.',
      );
    }
    return null;
  }
  return (
    <div {...element.props} ref={ref}>
      {children}
    </div>
  );
};
