import { foldRight, last, unsafeUpdateAt, init } from 'fp-ts/lib/Array';
import { Endomorphism, Predicate, Refinement } from 'fp-ts/lib/function';
import {
  chain,
  fold,
  fromPredicate,
  none,
  Option,
  some,
  toNullable,
} from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import { Lens, Optional, Prism } from 'monocle-ts/lib';
import { indexArray } from 'monocle-ts/lib/Index/Array';
import { Children, ReactDOM, ReactNode } from 'react';
import { $Values } from 'utility-types';
import { EditorNode, id, SetNodeEditorPathRef } from './node';
import { EditorPath } from './path';
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

export const editorElementChildIsEditorTextNotBR: Refinement<
  EditorElementChild,
  EditorText
> = (child): child is EditorText => {
  return isEditorText(child) && !editorTextIsBR(child);
};

/**
 * Like https://developer.mozilla.org/en-US/docs/Web/API/Node/normalize,
 * except strings can be empty. Empty strings are rendered as BR.
 * If nothing has been normalized, the same element is returned.
 */
export const normalizeEditorElement: Endomorphism<EditorElement> = element => {
  // This flag is good enough for now. We can use fp-ts These later.
  let somethingHasBeenNormalized = false;
  const children = element.children.reduce<(EditorElementChild)[]>(
    (array, child) => {
      if (isEditorElement(child)) {
        const normalizedChild = normalizeEditorElement(child);
        if (normalizedChild !== child) somethingHasBeenNormalized = true;
        return [...array, normalizedChild];
      }
      if (editorTextIsBR(child)) return [...array, child];
      return pipe(
        last(array),
        chain(fromPredicate(editorElementChildIsEditorTextNotBR)),
        fold(
          () => [...array, child],
          previousText => {
            somethingHasBeenNormalized = true;
            return unsafeUpdateAt(
              array.length - 1,
              { ...previousText, text: previousText.text + child.text },
              array,
            );
          },
        ),
      );
    },
    [],
  );
  // Preserve identity, otherwise it would always create new objects.
  // https://github.com/gcanti/fp-ts/issues/976
  if (!somethingHasBeenNormalized) return element;
  return { ...element, children };
};

/**
 * Like https://developer.mozilla.org/en-US/docs/Web/API/Node/normalize,
 * except strings can be empty. Empty string is considered to be BR.
 */
export const editorElementIsNormalized: Predicate<EditorElement> = element => {
  const normalizedElement = normalizeEditorElement(element);
  // We don't need short circuit. We can leverage identity check.
  return element === normalizedElement;
};

// TODO: Can we recursively remove ID from EditorElement type?
export const recursiveRemoveID = (element: EditorElement): any => {
  if (element == null) return element;
  // eslint-disable-next-line no-shadow, @typescript-eslint/no-unused-vars
  const { id, ...objectWithoutID } = element;
  return {
    ...objectWithoutID,
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
export function getTextTraversal(
  parentElementPath: EditorPath,
  index: number,
): Optional<EditorElement, EditorText> {
  return getElementTraversal(parentElementPath)
    .composeLens(childrenLens)
    .composeOptional(getChildAtOptional(index))
    .composePrism(textPrism);
}

/**
 * Ensure text traversal. If EditorPath focuses to text offset, get parent path.
 */
export function ensureTextTraversal(
  path: EditorPath,
  element: EditorElement,
): Optional<EditorElement, EditorText> {
  return pipe(
    path,
    foldRight(
      () => {
        throw new Error('TODO: Refactor.');
      },
      (path, index) => {
        const textTraversal = getTextTraversal(path, index);
        if (textTraversal.asFold().getAll(element).length > 0)
          return textTraversal;
        return ensureTextTraversal(path, element);
      },
    ),
  );
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
    // TODO: Refactor all.
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
      return pipe(
        init(range.anchor),
        fold(
          () => element,
          foldRight(
            () => element,
            (init, index) => {
              // @ts-ignore Refactor later.
              const startOffset = anchorMaterializedPath.to.offset;
              // @ts-ignore Refactor later.
              const endOffset = focusMaterializedPath.to.offset;
              return getTextTraversal(init, index).modify(editorText => {
                const text =
                  editorText.text.slice(0, startOffset) +
                  editorText.text.slice(endOffset);
                return { ...editorText, text };
              })(element);
            },
          ),
        ),
      );
    }
    return element;
  };
}
