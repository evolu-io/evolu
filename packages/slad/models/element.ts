import { unsafeUpdateAt } from 'fp-ts/lib/Array';
import { Children, ReactDOM, ReactNode } from 'react';
import invariant from 'tiny-invariant';
import { $Values } from 'utility-types';
import { SetNodeEditorPathRef } from '../hooks/useSetNodeEditorPathRef';
import { EditorNode, id, isEditorNode } from './node';
import {
  EditorPath,
  editorPathIsEmpty,
  invariantPathIsNotEmpty,
  invariantParentPathAndLastIndex,
  invariantParentPath,
} from './path';
import {
  EditorSelection,
  editorSelectionAsRange,
  editorSelectionIsCollapsed,
} from './selection';
import {
  EditorText,
  editorTextIsBR,
  EditorTextWithOffset,
  invariantIsEditorText,
  isEditorText,
  isEditorTextWithOffset,
} from './text';

/**
 * EditorElement is the base model for all other editor elements.
 */
export interface EditorElement extends EditorNode {
  readonly children: readonly (EditorElementChild)[];
}

export type EditorElementChild = EditorElement | EditorText;

export type RenderEditorElement = (
  element: EditorElement,
  children: ReactNode,
  ref: SetNodeEditorPathRef,
) => ReactNode;

export type MapEditorElement = <T extends EditorElement>(element: T) => T;

export function isEditorElement(value: unknown): value is EditorElement {
  return (
    isEditorNode(value) && Array.isArray((value as EditorElement).children)
  );
}

/**
 * If point.to isEditorTextWithOffset, return editorText. This ensures
 * we can always get EditorElementChild from EditorElementPoint.
 */
export function editorElementPointAsChild(
  point: EditorElementPoint,
): EditorElementChild {
  return isEditorTextWithOffset(point.to) ? point.to.editorText : point.to;
}

export function invariantIsEditorElement(
  value: unknown,
): value is EditorElement {
  invariant(isEditorElement(value), 'Value is not EditorElement.');
  return true;
}

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
 * EditorPath can be resolved to EditorElement, EditorText, or EditorTextWithOffset.
 */
export type EditorElementPointTo =
  | EditorElement
  | EditorText
  | EditorTextWithOffset;

export function isEditorElementPointTo(
  value: unknown,
): value is EditorElementPointTo {
  if (value == null) return false;
  return (
    isEditorElement(value) ||
    isEditorText(value) ||
    isEditorTextWithOffset(value)
  );
}

/**
 * EditorElementPoint is materialized EditorPath in EditorElement.
 */
export interface EditorElementPoint {
  to: EditorElementPointTo;
  parents: EditorElement[];
}

export function isEditorElementPoint(
  value: unknown,
): value is EditorElementPoint {
  if (value == null) return false;
  const point = value as EditorElementPoint;
  if (!Array.isArray(point.parents)) return false;
  return isEditorElementPointTo(point.to);
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
  const editorChildren = Children.toArray(children).map(child => {
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
export function editorElementPoint(path: EditorPath) {
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
// @ts-ignore
export const recursiveRemoveID = element => {
  if (element == null) return element;
  // eslint-disable-next-line no-shadow, @typescript-eslint/no-unused-vars
  const { id, ...objectWithoutID } = element;
  return {
    ...objectWithoutID,
    // @ts-ignore
    children: element.children.map(child => {
      if (isEditorText(child)) {
        // eslint-disable-next-line no-shadow, @typescript-eslint/no-unused-vars
        const { id, ...childWithoutID } = child;
        return childWithoutID;
      }
      return recursiveRemoveID(child);
    }),
  };
};

export function editorElementLens(path: EditorPath) {
  invariantPathIsNotEmpty(path);
  function get(): (element: EditorElement) => EditorElementPoint | null {
    return element => {
      return editorElementPoint(path)(element);
    };
  }

  function set(child: EditorElementChild): MapEditorElement {
    return element => {
      const point = get()(element);
      if (!invariantIsEditorElementPoint(point)) return element;
      const [parentPath, lastIndex] = invariantParentPathAndLastIndex(
        // When the path points to EditorTextWithOffset, get parent path.
        isEditorTextWithOffset(point.to) ? invariantParentPath(path) : path,
      );
      function getUpdatedChildren() {
        if (editorPathIsEmpty(parentPath)) return child;
        const parentPathChild = element.children[lastIndex];
        if (!invariantIsEditorElement(parentPathChild)) return;
        return editorElementLens(parentPath).set(child)(parentPathChild);
      }
      const updatedChildren = getUpdatedChildren();
      return {
        ...element,
        children: unsafeUpdateAt(
          lastIndex,
          updatedChildren,
          element.children as EditorElement[],
        ),
      };
    };
  }

  function modify(
    modifier: (child: EditorElementChild) => EditorElementChild,
  ): MapEditorElement {
    return element => {
      const point = get()(element);
      if (!isEditorElementPoint(point))
        throw new Error(
          'Not defined point in editorElementLens modify. ' +
            'Check whether EditorState selections matches EditorState element.',
        );
      const child = editorElementPointAsChild(point);
      const nextChild = modifier(child);
      return set(nextChild)(element);
    };
  }
  return { get, set, modify };
}

// TODO:
// export function editorElementLenses(selection)

export function deleteContentElement(
  selection: EditorSelection,
): MapEditorElement {
  return element => {
    const range = editorSelectionAsRange(selection);
    const anchorPoint = editorElementPoint(range.anchor)(element);
    const focusPoint = editorElementPoint(range.focus)(element);
    if (!invariantIsEditorElementPoint(anchorPoint)) return element;
    if (!invariantIsEditorElementPoint(focusPoint)) return element;
    // TODO: Handle other cases, with lenses.
    if (
      // Just deleting text on the same EditorTexts.
      isEditorTextWithOffset(anchorPoint.to) &&
      isEditorTextWithOffset(focusPoint.to) &&
      anchorPoint.to.editorText === focusPoint.to.editorText
    ) {
      const parentPath = invariantParentPath(range.anchor);
      const startOffset = anchorPoint.to.offset;
      const endOffset = focusPoint.to.offset;
      return editorElementLens(parentPath).modify(child => {
        if (!invariantIsEditorText(child)) return child;
        return {
          ...child,
          text: child.text.slice(0, startOffset) + child.text.slice(endOffset),
        };
      })(element);
    }
    return element;
  };
}

export function setTextElement(
  text: string,
  selection: EditorSelection,
): MapEditorElement {
  return element => {
    if (editorSelectionIsCollapsed(selection)) {
      return editorElementLens(selection.anchor).modify(child => {
        if (!invariantIsEditorText(child)) return child;
        return { ...child, text };
      })(element);
    }
    return element;
  };
}
