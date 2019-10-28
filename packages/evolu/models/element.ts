import { foldRight, last, unsafeUpdateAt } from 'fp-ts/lib/Array';
import { Endomorphism, Predicate, Refinement } from 'fp-ts/lib/function';
import { chain, fold, fromPredicate } from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import { Lens, Optional, Prism } from 'monocle-ts/lib';
import { indexArray } from 'monocle-ts/lib/Index/Array';
import { Children } from 'react';
import {
  Element,
  Child,
  Node,
  Path,
  ReactElement,
  Selection,
  Text,
} from '../types';
import { id } from './node';
import { isCollapsedSelection } from './selection';
import { isText, textIsBR } from './text';

export const isElement: Refinement<Node, Element> = (node): node is Element => {
  return Array.isArray((node as Element).children);
};

export const childIsElement: Refinement<Child, Element> = (
  child,
): child is Element => isElement(child);

export const childIsText: Refinement<Child, Text> = (child): child is Text =>
  isText(child);

export const childIsTextNotBR: Refinement<Child, Text> = (
  child,
): child is Text => {
  return isText(child) && !textIsBR(child);
};

/**
 * Map `<div>a</div>` to `{ id: id(), tag: 'div', children: [{ id: id(), text: 'a' }] }` etc.
 */
export const jsx = (element: JSX.Element): ReactElement => {
  const {
    type: tag,
    props: { children = [], ...props },
  } = element;
  const elementChildren = Children.toArray(children).map(child => {
    if (typeof child === 'string') {
      const text: Text = { id: id(), text: child };
      return text;
    }
    if (child.type === 'br') {
      const text: Text = { id: id(), text: '' };
      return text;
    }
    return jsx(child);
  });
  const elementProps = Object.keys(props).length > 0 ? props : undefined;
  return {
    id: id(),
    tag,
    props: elementProps,
    children: elementChildren,
  };
};

/**
 * Like https://developer.mozilla.org/en-US/docs/Web/API/Node/normalize,
 * except strings can be empty. Empty strings are rendered as BR.
 * If nothing has been normalized, the same element is returned.
 */
export const normalizeElement: Endomorphism<Element> = element => {
  // This flag is good enough for now. We can use fp-ts These later.
  let somethingHasBeenNormalized = false;
  const children = element.children.reduce<(Child)[]>((array, child) => {
    if (isElement(child)) {
      const normalizedChild = normalizeElement(child);
      if (normalizedChild !== child) somethingHasBeenNormalized = true;
      return [...array, normalizedChild];
    }
    if (textIsBR(child)) return [...array, child];
    return pipe(
      last(array),
      chain(fromPredicate(childIsTextNotBR)),
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
  }, []);
  // Preserve identity, otherwise it would always create new objects.
  // https://github.com/gcanti/fp-ts/issues/976
  if (!somethingHasBeenNormalized) return element;
  return { ...element, children };
};

/**
 * Like https://developer.mozilla.org/en-US/docs/Web/API/Node/normalize,
 * except strings can be empty. Empty string is considered to be BR.
 */
export const isNormalizedElement: Predicate<Element> = element => {
  const normalizedElement = normalizeElement(element);
  // We don't need short circuit. We can leverage identity check.
  return element === normalizedElement;
};

// @ts-ignore TODO: Recursively remove ID from Element and its children.
export const mapElementToIDless = (element: Element) => {
  if (element == null) return element;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, ...objectWithoutID } = element;
  return {
    ...objectWithoutID,
    children: element.children.map(child => {
      if (isText(child)) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, ...childWithoutID } = child;
        return childWithoutID;
      }
      return mapElementToIDless(child);
    }),
  };
};

/**
 * Focus on the children of Element.
 */
export const childrenLens = Lens.fromProp<Element>()('children');

/**
 * Focus on the child at index of Child[].
 */
export const getChildAt = (index: number) => indexArray<Child>().index(index);

/**
 * Focus on Element of Child.
 */
export const elementPrism = Prism.fromPredicate(childIsElement);

/**
 * Focus on Text of Child.
 */
export const textPrism = Prism.fromPredicate(childIsText);

/**
 * Focus on Element by Path.
 */
export const getElementTraversal = (path: Path) =>
  path.reduce(
    (acc, pathIndex) =>
      acc
        .composeLens(childrenLens)
        .composeOptional(getChildAt(pathIndex))
        .composePrism(elementPrism),
    elementPrism.asOptional() as Optional<Element, Element>,
  );

/**
 * Focus on Text by Path.
 */
export const getTextTraversal = (
  parentElementPath: Path,
  index: number,
): Optional<Element, Text> =>
  getElementTraversal(parentElementPath)
    .composeLens(childrenLens)
    .composeOptional(getChildAt(index))
    .composePrism(textPrism);

/**
 * Ensure text traversal. If Path focuses to text offset, get parent path.
 */
export const ensureTextTraversal = (
  path: Path,
  element: Element,
): Optional<Element, Text> =>
  pipe(
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

export const setTextElement = (
  text: string,
  selection: Selection,
): Endomorphism<Element> => element => {
  // TODO: Refactor to range operation.
  const onlyTextIsSelected: Predicate<Selection> = selection => {
    const anchorFold = ensureTextTraversal(selection.anchor, element).asFold();
    const focusFold = ensureTextTraversal(selection.focus, element).asFold();
    if (!anchorFold.exist(isText)(element)) return false;
    if (!focusFold.exist(isText)(element)) return false;
    return anchorFold.getAll(element)[0] === focusFold.getAll(element)[0];
  };

  if (isCollapsedSelection(selection) || onlyTextIsSelected(selection)) {
    const path = selection.anchor;
    return ensureTextTraversal(path, element).modify(t => {
      return { ...t, text };
    })(element);
  }
  return element;
};

// TODO: Some of those from symbol-tree lib.
// hasChildren
// firstChild
// lastChild
// previousSibling
// nextSibling
// parent
// lastInclusiveDescendant
// preceding
// following
// childrenToArray
// ancestorsToArray
// treeToArray
// childrenIterator
// previousSiblingsIterator
// nextSiblingsIterator
// ancestorsIterator
// treeIterator
// index
// childrenCount
// compareTreePosition
// remove
// insertBefore
// insertAfter
// prependChild
// appendChild
