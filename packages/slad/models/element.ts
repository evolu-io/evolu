import { ReactDOM, ReactNode } from 'react';
import invariant from 'tiny-invariant';
import { $Values } from 'utility-types';
import { SetNodeEditorPathRef } from '../hooks/useSetNodeEditorPathRef';
import { EditorPath } from './path';

/**
 * EditorElement is the base model for all other editor elements.
 */
export interface EditorElement {
  readonly children: readonly (EditorElementChild)[];
}

export type EditorElementChild = EditorElement | EditorText;

/**
 * EditorText is object because even the two identical texts need own identity.
 * Imagine some user picks one of few same texts to edit. React needs stable keys
 * eagerly generated, otherwise it would reset related component instead of update it.
 */
export interface EditorText {
  text: string;
}

interface EditorDOMElementFactory<T, P> extends EditorElement {
  readonly tag: T;
  readonly props?: P;
  readonly children: readonly (EditorDOMElement | EditorText)[];
}

/**
 * EditorDOMElement has the same props as ReactDOM.
 */
export type EditorDOMElement = $Values<
  {
    [T in keyof ReactDOM]: EditorDOMElementFactory<
      T,
      ReturnType<ReactDOM[T]>['props']
    >;
  }
>;

// TODO: Use upcoming recursive type references.
// https://github.com/steida/slad/issues/28
// https://github.com/microsoft/TypeScript/pull/33050
// This is hacky workaround. It works but there must be ts-ignore for some reason.
type OmitString<T> = T extends EditorText ? never : T;
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

// https://www.typescriptlang.org/docs/handbook/advanced-types.html#using-type-predicates
export function isEditorText(child: EditorElementChild): child is EditorText {
  return (child as EditorText).text !== undefined;
}

export function invariantIsEditorText(
  child: EditorElementChild,
): child is EditorText {
  invariant(isEditorText(child), 'EditorElementChild is not EditorText.');
  return true;
}

export function invariantIsEditorElement(
  child: EditorElementChild,
): child is EditorElement {
  invariant(!isEditorText(child), 'EditorElementChild is not EditorElement.');
  return true;
}

/**
 * Like https://developer.mozilla.org/en-US/docs/Web/API/Node/normalize,
 * except strings can be empty. Editor and Renderer render empty string as BR.
 */
export function normalizeEditorElement<T extends EditorElement>(element: T): T {
  return {
    ...element,
    ...(element.children
      ? {
          children: element.children.reduce<(EditorElementChild)[]>(
            (array, child) => {
              if (!isEditorText(child))
                return [...array, normalizeEditorElement(child)];
              // Always check existence in an array manually.
              // https://stackoverflow.com/a/49450994/233902
              const previousChild = array.length > 0 && array[array.length - 1];
              if (previousChild && isEditorText(previousChild)) {
                array[array.length - 1] = {
                  ...previousChild,
                  text: previousChild.text + child.text,
                };
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
 * except strings can be empty. Editor and Renderer render empty string as BR.
 */
export function isNormalizedEditorElement({
  children,
}: EditorElement): boolean {
  return !children.some((child, i) => {
    if (isEditorText(child)) {
      if (i > 0 && isEditorText(children[i - 1])) return true;
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
    const child = parent.children[index];
    if (!invariantIsEditorElement(child)) return;
    parent = child;
  });
  return parent;
}
