import { ReactDOM, ReactNode } from 'react';
import invariant from 'tiny-invariant';
import { $Values } from 'utility-types';
import { SetNodeEditorPathRef } from '../hooks/useSetNodeEditorPathRef';
import { EditorPath } from './path';

export type EditorElementChild = EditorElement | string;

/**
 * EditorElement is the base model for all other editor elements.
 */
export interface EditorElement {
  readonly children: readonly (EditorElementChild)[];
}

interface EditorReactDOMElementFactory<T, P> extends EditorElement {
  readonly tag: T;
  readonly props?: P;
  readonly children: readonly (EditorReactDOMElement | string)[];
}

interface EditorReactDOMElementDIV extends EditorElement {
  readonly tag?: 'div';
  readonly props?: ReturnType<ReactDOM['div']>['props'];
  readonly children: readonly (EditorReactDOMElement | string)[];
}

/**
 * EditorReactDOMElement has props the same as ReactDOM. If tag is ommited, it's DIV.
 */
export type EditorReactDOMElement =
  | EditorReactDOMElementDIV
  | $Values<
      {
        [T in keyof ReactDOM]: EditorReactDOMElementFactory<
          T,
          ReturnType<ReactDOM[T]>['props']
        >;
      }
    >;

// TODO: Use upcoming recursive type references.
// https://github.com/steida/slad/issues/28
// https://github.com/microsoft/TypeScript/pull/33050
// This is hacky workaround:
type OmitString<T> = T extends string ? never : T;
type UnionFromAray<T> = T extends (infer U)[] ? OmitString<U> : never;
type UnionFromElementAndItsChildren<T extends EditorElement> =
  | T
  | UnionFromAray<T['children']>;
// @ts-ignore Do not fix it, wait for recursive type references.
type Union<T> = UnionFromElementAndItsChildren<T>;
type DeepFiniteNestedUnion<T> = Union<Union<Union<Union<Union<Union<T>>>>>>;

export type RenderEditorElement<T extends EditorElement> = (
  element: DeepFiniteNestedUnion<T>,
  children: ReactNode,
  ref: SetNodeEditorPathRef,
) => ReactNode;

/**
 * Like https://developer.mozilla.org/en-US/docs/Web/API/Node/normalize,
 * except strings can be empty. Editor renders empty string as BR.
 */
export function normalizeEditorElement(element: EditorElement): EditorElement {
  return {
    ...element,
    ...(element.children
      ? {
          children: element.children.reduce<(EditorElementChild)[]>(
            (array, child) => {
              if (typeof child !== 'string')
                return [...array, normalizeEditorElement(child)];
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
 * Like https://developer.mozilla.org/en-US/docs/Web/API/Node/normalize,
 * except strings can be empty. Editor renders empty string as BR.
 */
export function isNormalizedEditorElement({
  children,
}: EditorElement): boolean {
  if (children == null) return true;
  return !children.some((child, i) => {
    if (typeof child === 'string') {
      if (i > 0 && typeof children[i - 1] === 'string') return true;
      return false;
    }
    return !isNormalizedEditorElement(child);
  });
}

export function getParentElementByPath(
  element: EditorElement,
  path: EditorPath,
): EditorElement {
  invariant(path.length > 0, 'getParentElementByPath: Path can not be empty.');
  let parent = element;
  const pathToParent = path.slice(0, -1);
  pathToParent.forEach(index => {
    const maybeElement = parent.children[index];
    if (typeof maybeElement === 'string') {
      invariant(false, 'getParentElementByPath: Parent can not be string.');
      return;
    }
    parent = maybeElement;
  });
  return parent;
}

export function invariantElementChildIsString(
  child: EditorElementChild,
): child is string {
  invariant(typeof child === 'string', 'EditorElementChild is not string.');
  return true;
}
