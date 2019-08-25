import { ReactDOM } from 'react';

/**
 * EditorElement is the base model for all other editor elements.
 */
export interface EditorElement {
  readonly children?: readonly (EditorElement | string)[] | undefined;
}

type CreateEditorReactDOMElement<T extends keyof ReactDOM> = {
  readonly tag?: T;
  readonly props?: ReturnType<ReactDOM[T]>['props'];
  readonly children?: readonly (EditorReactDOMElement | string)[] | undefined;
};

/**
 * EditorReactDOMElement has props the same as in ReactDOM.
 */
export type EditorReactDOMElement = CreateEditorReactDOMElement<keyof ReactDOM>;

/**
 * https://developer.mozilla.org/en-US/docs/Web/API/Node/normalize
 */
export function normalizeEditorElement(element: EditorElement): EditorElement {
  return {
    ...element,
    ...(element.children
      ? {
          children: element.children.reduce<(EditorElement | string)[]>(
            (array, child) => {
              if (typeof child !== 'string')
                return [...array, normalizeEditorElement(child)];
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
export function isNormalizedEditorElement({
  children,
}: EditorElement): boolean {
  if (children == null) return true;
  return !children.some((child, i) => {
    if (typeof child === 'string') {
      if (child.length === 0) return true;
      if (i > 0 && typeof children[i - 1] === 'string') return true;
      return false;
    }
    return !isNormalizedEditorElement(child);
  });
}
