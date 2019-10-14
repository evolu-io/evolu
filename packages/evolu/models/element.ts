import { Predicate, Refinement, Endomorphism } from 'fp-ts/lib/function';
import { Lens, Prism, Optional } from 'monocle-ts/lib';
import { indexArray } from 'monocle-ts/lib/Index/Array';
import { Children, ReactDOM, ReactNode } from 'react';
import { $Values } from 'utility-types';
import { Option, some, none, toNullable, fold } from 'fp-ts/lib/Option';
import { lookup } from 'fp-ts/lib/Array';
import { pipe } from 'fp-ts/lib/pipeable';
import { EditorNode, id, SetNodeEditorPathRef } from './node';
import { EditorPath, getParentPath, getParentPathAndLastIndex } from './path';
import {
  EditorSelection,
  editorSelectionAsRange,
  editorSelectionIsCollapsed,
} from './selection';
import { EditorText, editorTextIsBR, isEditorText } from './text';

/**
 * EditorElement is the base model for all other editor elements.
 */
export interface EditorElement extends EditorNode {
  readonly children: (EditorElementChild)[];
}

export type EditorElementChild = EditorElement | EditorText;

export type RenderEditorElement = (
  element: EditorElement,
  children: ReactNode,
  ref: SetNodeEditorPathRef,
) => ReactNode;

export const isEditorElement: Refinement<EditorNode, EditorElement> = (
  value,
): value is EditorElement => Array.isArray((value as EditorElement).children);

export const editorElementChildIsEditorElement: Refinement<
  EditorElementChild,
  EditorElement
> = (value): value is EditorElement => isEditorElement(value);

export const editorElementChildIsEditorText: Refinement<
  EditorElementChild,
  EditorText
> = (value): value is EditorText => isEditorText(value);

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

export function materializeEditorPath(
  path: EditorPath,
): (element: EditorElement) => Option<MaterializedEditorPath> {
  return element => {
    const parents: MaterializedEditorPath['parents'] = [];
    let to: MaterializedEditorPath['to'] = element;
    for (let i = 0; i < path.length; i++) {
      const pathIndex = path[i];
      if (isEditorElement(to)) {
        parents.push(to);
        to = to.children[pathIndex];
        if (to == null) return none;
      } else if (isEditorText(to)) {
        const pathContinues = i < path.length - 1;
        if (pathContinues || pathIndex > to.text.length) return none;
        return some({ parents, to: { editorText: to, offset: pathIndex } });
      }
    }
    return some({ parents, to });
  };
}

/**
 * Map `<div>a</div>` to `{ id: id(), tag: 'div', children: [{ id: id(), text: 'a' }] }` etc.
 */
export function jsx(element: JSX.Element): EditorReactElement {
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
    return jsx(child);
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

export const normalizeEditorElement: Endomorphism<EditorElement> = element => {
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
};

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
    return pipe(
      lookup(i - 1, children),
      fold(
        () => false,
        previous => isEditorText(previous) && !editorTextIsBR(previous),
      ),
    );
  });
};

// TODO: Can we recursively remove ID from EditorElement?
export const recursiveRemoveID = (element: EditorElement): any => {
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

// Functional optics.
// https://github.com/gcanti/monocle-ts

/**
 * Focus on the children of EditorElement.
 */
export const childrenLens = Lens.fromProp<EditorElement>()('children');

/**
 * Focus on the child at index of EditorElementChild[].
 */
export function getChildAtOptional(index: number) {
  return indexArray<EditorElementChild>().index(index);
}

/**
 * Focus on EditorElement of EditorElementChild.
 */
export const elementPrism = Prism.fromPredicate(
  editorElementChildIsEditorElement,
);

/**
 * Focus on EditorText of EditorElementChild.
 */
export const textPrism = Prism.fromPredicate(editorElementChildIsEditorText);

/**
 * Focus on EditorElement by EditorPath.
 */
export function getElementTraversal(path: EditorPath) {
  return path.reduce(
    (acc, pathIndex) => {
      return acc
        .composeLens(childrenLens)
        .composeOptional(getChildAtOptional(pathIndex))
        .composePrism(elementPrism);
    },
    elementPrism.asOptional() as Optional<EditorElement, EditorElement>,
  );
}

/**
 * Focus on EditorText by EditorPath.
 */
export function getTextTraversal(path: EditorPath) {
  const [parentPath, lastIndex] = getParentPathAndLastIndex(path);
  return getElementTraversal(parentPath)
    .composeLens(childrenLens)
    .composeOptional(getChildAtOptional(lastIndex))
    .composePrism(textPrism);
}

/**
 * Ensure text traversal. If EditorPath focuses to text offset, get parent path.
 */
export function ensureTextTraversal(path: EditorPath, element: EditorElement) {
  let textTraversal = getTextTraversal(path);
  if (textTraversal.asFold().getAll(element).length === 0)
    textTraversal = getTextTraversal(getParentPath(path));
  return textTraversal;
}

export function setTextElement(
  text: string,
  selection: EditorSelection,
): Endomorphism<EditorElement> {
  return element => {
    const onlyTextIsSelected: Predicate<EditorSelection> = selection => {
      const anchorFold = ensureTextTraversal(
        selection.anchor,
        element,
      ).asFold();
      const focusFold = ensureTextTraversal(selection.focus, element).asFold();
      // TODO: Consider toNullable, eq, or something else. This code is probably not ideal.
      if (!anchorFold.exist(isEditorText)(element)) return false;
      if (!focusFold.exist(isEditorText)(element)) return false;
      return anchorFold.getAll(element)[0] === focusFold.getAll(element)[0];
    };

    if (
      editorSelectionIsCollapsed(selection) ||
      onlyTextIsSelected(selection)
    ) {
      const path = selection.anchor;
      return ensureTextTraversal(path, element).modify(editorText => {
        return { ...editorText, text };
      })(element);
    }
    return element;
  };
}

export function deleteContentElement(
  selection: EditorSelection,
): Endomorphism<EditorElement> {
  return element => {
    const range = editorSelectionAsRange(selection);
    // TODO: Replace toNullable with something.
    const anchorMaterializedPath = toNullable(
      materializeEditorPath(range.anchor)(element),
    );
    const focusMaterializedPath = toNullable(
      materializeEditorPath(range.focus)(element),
    );
    if (anchorMaterializedPath == null || focusMaterializedPath == null)
      return element;
    // TODO: Handle other cases, with lenses.
    if (
      // Just deleting text on the same EditorTexts.
      isEditorTextWithOffset(anchorMaterializedPath.to) &&
      isEditorTextWithOffset(focusMaterializedPath.to) &&
      anchorMaterializedPath.to.editorText ===
        focusMaterializedPath.to.editorText
    ) {
      const parentPath = getParentPath(range.anchor);
      const startOffset = anchorMaterializedPath.to.offset;
      const endOffset = focusMaterializedPath.to.offset;
      return getTextTraversal(parentPath).modify(editorText => {
        const text =
          editorText.text.slice(0, startOffset) +
          editorText.text.slice(endOffset);
        return { ...editorText, text };
      })(element);
    }
    return element;
  };
}
