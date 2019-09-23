import { ReactDOM, ReactNode } from 'react';
import invariant from 'tiny-invariant';
import { $Values } from 'utility-types';
import flattenDeep from 'lodash.flattendeep';
import { SetNodeEditorPathRef } from '../hooks/useSetNodeEditorPathRef';
import { EditorPath } from './path';
import { EditorNode, id } from './node';
import { EditorText, isEditorText, editorTextIsBR } from './text';

/**
 * EditorElement is the base model for all other editor elements.
 */
export interface EditorElement extends EditorNode {
  readonly children: readonly (EditorElementChild)[];
}

export type EditorElementChild = EditorElement | EditorText;

interface EditorReactElementFactory<T, P> extends EditorElement {
  readonly tag: T;
  readonly props?: P;
  readonly children: readonly (EditorReactElement | EditorText)[];
}

export type EditorReactElement = $Values<
  {
    [T in keyof ReactDOM]: EditorReactElementFactory<
      T,
      ReturnType<ReactDOM[T]>['props']
    >;
  }
>;

/**
 * Map `<div>a</div>` to `{ id: id(), tag: 'div', children: [{ id: id(), text: 'a' }] }` etc.
 */
export function jsxToEditorReactElement(
  element: JSX.Element,
): EditorReactElement {
  const {
    type: tag,
    props: { children = [], ...props },
  } = element;
  const editorChildren = flattenDeep([children]).map(child => {
    if (typeof child === 'string') {
      const text: EditorText = { id: id(), text: child };
      return text;
    }
    if (child.type === 'br') {
      const text: EditorText = { id: id(), text: '' };
      return text;
    }
    return jsxToEditorReactElement(child);
  });
  const editorProps = Object.keys(props).length > 0 ? props : undefined;
  return {
    id: id(),
    tag,
    props: editorProps,
    children: editorChildren,
  };
}

export type RenderEditorElement = (
  element: EditorElement,
  children: ReactNode,
  ref: SetNodeEditorPathRef,
) => ReactNode;

export function invariantIsEditorElement(
  child: EditorElementChild,
): child is EditorElement {
  invariant(!isEditorText(child), 'EditorElementChild is not EditorElement.');
  return true;
}

/**
 * Like https://developer.mozilla.org/en-US/docs/Web/API/Node/normalize,
 * except strings can be empty. Empty string is considered to be BR.
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
              if (editorTextIsBR(child)) return [...array, child];
              // Always check existence in an array manually.
              // https://stackoverflow.com/a/49450994/233902
              const previousChild = array.length > 0 && array[array.length - 1];
              if (
                previousChild &&
                isEditorText(previousChild) &&
                !editorTextIsBR(previousChild)
              ) {
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
 * except strings can be empty. Empty string is considered to be BR.
 */
export function editorElementIsNormalized({
  children,
}: EditorElement): boolean {
  return !children.some((child, i) => {
    if (!isEditorText(child)) return !editorElementIsNormalized(child);
    if (editorTextIsBR(child)) return false;
    const previous = children[i - 1];
    if (previous && isEditorText(previous) && !editorTextIsBR(previous))
      return true;
    return false;
  });
}

export function editorElementChild(
  element: EditorElement,
  path: EditorPath,
): EditorElementChild {
  return path.reduce(
    (editorElementChild, index) => {
      if (!invariantIsEditorElement(editorElementChild))
        return editorElementChild;
      return editorElementChild.children[index];
    },
    element as EditorElementChild,
  );
}

// TODO: Fix types.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function recursiveRemoveID(element: EditorElement): any {
  if (element == null) return element;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, ...objectWithoutID } = element;
  return {
    ...objectWithoutID,
    children: element.children.map(child => {
      if (isEditorText(child)) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, ...childWithoutID } = child;
        return childWithoutID;
      }
      return recursiveRemoveID(child);
    }),
  };
}
