import { ReactDOM, ReactNode } from 'react';
import invariant from 'tiny-invariant';
import { $Values } from 'utility-types';
import flattenDeep from 'lodash.flattendeep';
import { SetNodeEditorPathRef } from '../hooks/useSetNodeEditorPathRef';
import { EditorPath } from './path';
import { EditorNode, id, isEditorNode } from './node';
import {
  EditorText,
  editorTextIsBR,
  isEditorText,
  EditorTextWithOffset,
  isEditorTextWithOffset,
} from './text';
import { EditorSelection, editorSelectionAsRange } from './selection';

/**
 * EditorElement is the base model for all other editor elements.
 */
export interface EditorElement extends EditorNode {
  readonly children: readonly (EditorElementChild)[];
}

export function isEditorElement(value: unknown): value is EditorElement {
  return (
    isEditorNode(value) && Array.isArray((value as EditorElement).children)
  );
}

export function invariantIsEditorElement(
  value: unknown,
): value is EditorElement {
  invariant(isEditorElement(value), 'Value is not EditorElement.');
  return true;
}

// Do we really need that? Isn't EditorNode good enough?
// TODO: Explain or replace it with EditorNode.
export type EditorElementChild = EditorElement | EditorText;

// export type EditorFragment = readonly EditorElementChild[];

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
 * EditorElementPoint is a position in EditorElement defined by EditorPath.
 * It's like materialized EditorPath. EditorPath points to EditorElement,
 * EditorText, or EditorTextWithOffset.
 */
export interface EditorElementPoint {
  to: EditorElement | EditorText | EditorTextWithOffset;
  parents: EditorElement[];
}

export function isEditorElementPoint(
  value: unknown,
): value is EditorElementPoint {
  if (value == null) return false;
  const point = value as EditorElementPoint;
  if (!Array.isArray(point.parents)) return false;
  return (
    isEditorElement(point.to) ||
    isEditorText(point.to) ||
    isEditorTextWithOffset(point.to)
  );
}

export function invariantIsEditorElementPoint(
  value: unknown,
): value is EditorElementPoint {
  invariant(isEditorElementPoint(value), 'Value is not EditorElementPoint.');
  return true;
}

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
              if (isEditorElement(child))
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

/**
 * Resolve EditorPath on EditorElement to EditorElementPoint or null.
 */
export function editorElementPath(path: EditorPath) {
  return (element: EditorElement): EditorElementPoint | null => {
    const parents: EditorElementPoint['parents'] = [];
    let to: EditorElementPoint['to'] = element;
    for (let i = 0; i < path.length; i++) {
      const pathIndex = path[i];
      if (isEditorElement(to)) {
        parents.push(to);
        to = to.children[pathIndex];
        if (to == null) return null;
      } else if (isEditorText(to)) {
        const pathContinues = i < path.length - 1;
        if (pathContinues || pathIndex > to.text.length) return null;
        return { parents, to: { editorText: to, offset: pathIndex } };
      }
    }
    return { parents, to };
  };
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

// produceEditorElement? asi jo

export function deleteContentElement(selection: EditorSelection) {
  return <T extends EditorElement>(element: T): T => {
    const range = editorSelectionAsRange(selection);
    // console.log(range);
    // pokud dva stejne, zmenit jen text, a to pro ted staci

    // nemuzu mit neco, co mi vrati bud el nebo text s indexem?
    // const anchorChild = editorElementChild()
    // editorElementChild
    // range,
    // deleteWithinEditorTexts
    // const [parentPath, index] = getParentPathAndLastIndex(selection.anchor);

    // TODO: Handle other cases, with one logic, if possible.
    // @ts-ignore
    return {
      id: element.id,
      children: [{ id: element.children[0].id, text: '' }],
    };
  };
}
