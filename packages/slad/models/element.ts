/**
 * Element is the most general base model for Editor.
 */
export interface Element {
  readonly children?: readonly (Element | string)[] | undefined;
}

/**
 * DivElement has props the same as React div element.
 */
export interface DivElement extends Element {
  readonly props?: React.HTMLAttributes<HTMLDivElement>;
  readonly children?: (DivElement | string)[] | undefined;
}

/**
 * https://developer.mozilla.org/en-US/docs/Web/API/Node/normalize
 */
export function normalizeElement(element: Element): Element {
  return {
    ...element,
    ...(element.children
      ? {
          children: element.children.reduce<(Element | string)[]>(
            (array, child) => {
              if (typeof child !== 'string')
                return [...array, normalizeElement(child)];
              if (child.length === 0) return array;
              const previousChild = array[array.length - 1];
              if (typeof previousChild === 'string') {
                array[array.length - 1] = previousChild + child;
                return array;
              }
              return [...array, child];
            },
            [],
          ),
        }
      : null),
  };
}

/**
 * https://developer.mozilla.org/en-US/docs/Web/API/Node/normalize
 */
export function isNormalizedElement({ children }: Element): boolean {
  if (children == null) return true;
  return !children.some((child, i) => {
    if (typeof child === 'string') {
      if (child.length === 0) return true;
      if (i > 0 && typeof children[i - 1] === 'string') return true;
      return false;
    }
    return !isNormalizedElement(child);
  });
}
