import { ReactDOM, ReactNode } from 'react';
import invariant from 'tiny-invariant';
import { $Values } from 'utility-types';
import flattenDeep from 'lodash.flattendeep';
import { SetNodeEditorPathRef } from '../hooks/useSetNodeEditorPathRef';
import { EditorPath } from './path';
import { EditorNodeIdentity, id } from './node';
import { EditorText } from './text';

/**
 * EditorElement is the base model for all other editor elements.
 */
export interface EditorElement extends EditorNodeIdentity {
  readonly children: readonly (EditorElementChild)[];
}

export type EditorElementChild = EditorElement | EditorText;

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

/**
 * Map `<div>a</div>` to `{ id: id(), tag: 'div', children: [{ id: id(), text: 'a' }] }` etc.
 */
export function jsxToEditorDOMElement(element: JSX.Element): EditorDOMElement {
  const {
    type: tag,
    props: { children, ...props },
  } = element;
  const editorChildren = flattenDeep([children]).map(child => {
    if (typeof child === 'string') {
      const text: EditorText = { id: id(), text: child };
      return text;
    }
    return jsxToEditorDOMElement(child);
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

/**
 * This is just helper rarely needed.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function recursiveRemoveID(object: EditorElement): any {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, ...objectWithoutID } = object;
  return {
    ...objectWithoutID,
    children: object.children.map(child => {
      if (isEditorText(child)) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, ...childWithoutID } = child;
        return childWithoutID;
      }
      return recursiveRemoveID(child);
    }),
  };
}
