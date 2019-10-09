import { unsafeUpdateAt } from 'fp-ts/lib/Array';
import { Children, ReactDOM, ReactNode } from 'react';
import invariant from 'tiny-invariant';
import { $Values } from 'utility-types';
import { Predicate, Refinement } from 'fp-ts/lib/function';
import { SetNodeEditorPathRef } from '../hooks/useSetNodeEditorPathRef';
import { EditorNode, id } from './node';
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
  invariantIsEditorText,
  isEditorText,
} from './text';

/**
 * EditorElement is the base model for all other editor elements.
 */
export interface EditorElement extends EditorNode {
  readonly children: (EditorElementChild)[];
}

// EditorElementChild could be EditorNode, but I prefer more strict schema.
export type EditorElementChild = EditorElement | EditorText;

export type RenderEditorElement = (
  element: EditorElement,
  children: ReactNode,
  ref: SetNodeEditorPathRef,
) => ReactNode;

export type MapEditorElement = <T extends EditorElement>(element: T) => T;

export const isEditorElement: Refinement<EditorNode, EditorElement> = (
  value,
): value is EditorElement => Array.isArray((value as EditorElement).children);

export type EditorTextWithOffset = {
  readonly editorText: EditorText;
  readonly offset: number;
};

export interface MaterializedEditorPath {
  to: EditorElement | EditorText | EditorTextWithOffset;
  parents: EditorElement[];
}

export const isEditorTextWithOffset: Refinement<
  MaterializedEditorPath['to'],
  EditorTextWithOffset
> = (value): value is EditorTextWithOffset => {
  const { editorText } = value as EditorTextWithOffset;
  return (
    editorText != null &&
    isEditorText(editorText) &&
    typeof (value as EditorTextWithOffset).offset === 'number'
  );
};

export function invariantIsEditorElement(
  value: EditorNode,
): value is EditorElement {
  invariant(isEditorElement(value), 'Value is not EditorElement.');
  return true;
}

interface EditorReactElementFactory<T, P> extends EditorElement {
  readonly tag: T;
  readonly props?: P;
  readonly children: (EditorReactElement | EditorText)[];
}

export type EditorReactElement = $Values<
  {
    [T in keyof ReactDOM]: EditorReactElementFactory<
      T,
      ReturnType<ReactDOM[T]>['props']
    >;
  }
>;

export function invariantMaterializedPathIsNotNull(
  value: MaterializedEditorPath | null,
): value is MaterializedEditorPath {
  invariant(value != null, 'MaterializedPath is null.');
  return true;
}

export function materializeEditorPath(path: EditorPath) {
  return (element: EditorElement): MaterializedEditorPath | null => {
    const parents: MaterializedEditorPath['parents'] = [];
    let to: MaterializedEditorPath['to'] = element;
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
export const editorElementIsNormalized: Predicate<EditorElement> = ({
  children,
}) => {
  return !children.some((child, i) => {
    if (!isEditorText(child)) return !editorElementIsNormalized(child);
    if (editorTextIsBR(child)) return false;
    const previous = children[i - 1];
    if (previous && isEditorText(previous) && !editorTextIsBR(previous))
      return true;
    return false;
  });
};

// @ts-ignore TODO: Fix types.
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

// TODO: Replace with monocle-ts.
export function editorElementLens(path: EditorPath) {
  invariantPathIsNotEmpty(path);

  function ensureTextParent(
    materializedPath: MaterializedEditorPath,
  ): EditorElementChild {
    return isEditorTextWithOffset(materializedPath.to)
      ? materializedPath.to.editorText
      : materializedPath.to;
  }

  function get(): (element: EditorElement) => MaterializedEditorPath | null {
    return element => {
      return materializeEditorPath(path)(element);
    };
  }

  function set(child: EditorElementChild): MapEditorElement {
    return element => {
      const materializedPath = get()(element);
      if (!invariantMaterializedPathIsNotNull(materializedPath)) return element;
      const [parentPath, lastIndex] = invariantParentPathAndLastIndex(
        isEditorTextWithOffset(materializedPath.to)
          ? invariantParentPath(path)
          : path,
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
      const materializedPath = get()(element);
      if (materializedPath == null)
        throw new Error(
          'Not defined materialized path in editorElementLens modify. ' +
            'Check whether EditorState selections matches EditorState element.',
        );
      const child = ensureTextParent(materializedPath);
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
    const anchorMaterializedPath = materializeEditorPath(range.anchor)(element);
    const focusMaterializedPath = materializeEditorPath(range.focus)(element);
    if (!invariantMaterializedPathIsNotNull(anchorMaterializedPath))
      return element;
    if (!invariantMaterializedPathIsNotNull(focusMaterializedPath))
      return element;
    // TODO: Handle other cases, with lenses.
    if (
      // Just deleting text on the same EditorTexts.
      isEditorTextWithOffset(anchorMaterializedPath.to) &&
      isEditorTextWithOffset(focusMaterializedPath.to) &&
      anchorMaterializedPath.to.editorText ===
        focusMaterializedPath.to.editorText
    ) {
      const parentPath = invariantParentPath(range.anchor);
      const startOffset = anchorMaterializedPath.to.offset;
      const endOffset = focusMaterializedPath.to.offset;
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
