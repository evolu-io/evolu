import React from 'react';
import invariant from 'tiny-invariant';
import { SladElement, RenderElement } from './SladEditorRenderElementContext';

export interface SladDivElement extends SladElement {
  props: React.HTMLAttributes<HTMLDivElement>;
  children?: (SladDivElement | string)[] | undefined;
}

// It should be possible to enforce this via types only, but TypeScript errors
// can be confusing, so it's good to have nice dev warning.
const isGoodEnoughSladDivElement = (
  element: SladElement,
): element is SladDivElement => {
  // https://overreacted.io/how-does-the-development-mode-work/
  if (process.env.NODE_ENV !== 'production') {
    const div = element as SladDivElement;
    return (
      typeof div.props === 'object' &&
      (div.props.style || div.props.className) != null
    );
  }
  return true;
};

export const renderDivElement: RenderElement<SladDivElement> = (
  element,
  children,
  ref,
) => {
  if (!isGoodEnoughSladDivElement(element)) {
    // https://overreacted.io/how-does-the-development-mode-work/
    if (process.env.NODE_ENV !== 'production') {
      invariant(
        false,
        'SladDivElement props has to have at least className or style prop. Or pass custom renderElement to SladEditor.',
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
