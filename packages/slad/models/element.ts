import { ReactDOM, ReactNode } from 'react';
import { SetNodeEditorPathRef } from '../hooks/useSetNodeEditorPathRef';

/**
 * EditorElement is the base model for all other editor elements.
 */
export interface EditorElement {
  readonly children?: readonly (EditorElement | string)[] | undefined;
}

/**
 * EditorReactDOMElement has props the same as in ReactDOM.
 * TODO: Fix mapping from ReactDOM. Now div can have width prop.
 */
export interface EditorReactDOMElement extends EditorElement {
  readonly tag?: keyof ReactDOM;
  readonly props?: ReturnType<ReactDOM[keyof ReactDOM]>['props'];
  readonly children?: readonly (EditorReactDOMElement | string)[] | undefined;
}

// For nice DX, renderElement element arg is an union of all nested elements.
// Unfortunately, infinite recursion is not possible with TypeScript.
// To be precise, it's possible for recreated trees (that's how DeepReadonly or
// Immutable types work), or via hack:
// https://medium.com/@michael.a.hensler/why-be-finite-when-you-can-be-infinite-e84d82865074
// But that hack should not be used:
// https://github.com/Microsoft/TypeScript/issues/24016#issuecomment-428745727
// https://stackoverflow.com/questions/51480502/recursive-version-of-unpackedt-in-typescript/51481332#51481332
// Nevermind, finite recursion is good enough for most cases.
// For really elbow deep nesting..., I bet custom renderElement can be used.
// Or something like https://github.com/dsherret/ts-morph
// Feel free to send PR.
type OmitString<T> = T extends string ? never : T;
type UnionFromAray<T> = T extends (infer U)[] ? OmitString<U> : never;
type UnionFromElementAndItsChildren<T extends EditorElement> =
  | T
  | UnionFromAray<T['children']>;
// For reason beyond my imagination, UnionFromElementAndItsChildren must be aliased,
// otherwise 'Union<Union<Union<T>>>' does not work.
// ..
type Union<T> = UnionFromElementAndItsChildren<T>;
// Max allowed nesting, otherwise:
// "Type instantiation is excessively deep and possibly infinite.ts(2589)"
// But it can even enlarged somehow:
// https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
// But I am pretty sure 6 is good enough.
export type DeepFiniteNestedUnion<T> = Union<
  Union<Union<Union<Union<Union<T>>>>>
>;

export type RenderEditorElement<T extends EditorElement> = (
  element: DeepFiniteNestedUnion<T>,
  children: ReactNode,
  ref: SetNodeEditorPathRef,
) => ReactNode;

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
