import { foldRight, last, unsafeUpdateAt, getEq } from 'fp-ts/lib/Array';
import { Eq, getStructEq, strictEqual, fromEquals } from 'fp-ts/lib/Eq';
import { Endomorphism, Predicate, Refinement } from 'fp-ts/lib/function';
import { IO } from 'fp-ts/lib/IO';
import { chain, fold, fromPredicate } from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import { Lens, Optional, Prism } from 'monocle-ts/lib';
import { indexArray } from 'monocle-ts/lib/Index/Array';
import nanoid from 'nanoid';
import { iso } from 'newtype-ts';
import { Children } from 'react';
import {
  Element,
  ElementID,
  Node,
  Path,
  ReactElement,
  Selection,
  Text,
} from '../types';
import { isCollapsed } from './selection';
import { isText, isTextNotBR, textIsBR } from './text';

export const eqElementID: Eq<ElementID> = { equals: strictEqual };

export const eqNode: Eq<Node> = fromEquals((x, y) =>
  isText(x)
    ? isText(y)
      ? strictEqual(x, y)
      : false
    : isText(y)
    ? false
    : // It's probably a bug in @typescript-eslint.
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      eqElement.equals(x, y),
);

export const eqNodes = getEq(eqNode);

// Recursive checking is cheap because fromEquals is using strict comparison.
export const eqElement: Eq<Element> = getStructEq({
  id: eqElementID,
  children: eqNodes,
});

export const isElement: Refinement<Node, Element> = (node): node is Element => {
  return Array.isArray((node as Element).children);
};

const isoNodeID = iso<ElementID>();

/**
 * Create React key for Element from its ID.
 */
export const createKeyForElement = (element: Element): string =>
  isoNodeID.unwrap(element.id);

/**
 * Create ElementID via nanoid(10).
 * https://zelark.github.io/nano-id-cc
 */
export const id: IO<ElementID> = () => isoNodeID.wrap(nanoid(10));

/**
 * Map `<div>a</div>` to `{ id: id(), tag: 'div', children: [{ id: id(), text: 'a' }] }` etc.
 */
export const jsx = (element: JSX.Element): ReactElement => {
  const {
    type: tag,
    props: { children = [], ...props },
  } = element;
  const elementChildren = Children.toArray(children).map(child => {
    if (typeof child === 'string') return child;
    if (child.type === 'br') return '';
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
  const children = element.children.reduce<(Node)[]>((array, child) => {
    if (isElement(child)) {
      const normalizedChild = normalizeElement(child);
      if (normalizedChild !== child) somethingHasBeenNormalized = true;
      return [...array, normalizedChild];
    }
    if (textIsBR(child)) return [...array, child];
    return pipe(
      last(array),
      chain(fromPredicate(isTextNotBR)),
      fold(
        () => [...array, child],
        previousText => {
          somethingHasBeenNormalized = true;
          return unsafeUpdateAt(array.length - 1, previousText + child, array);
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
export const elementToIDless = (element: Element) => {
  if (element == null) return element;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, ...objectWithoutID } = element;
  return {
    ...objectWithoutID,
    children: element.children.map(child => {
      if (isText(child)) return child;
      return elementToIDless(child);
    }),
  };
};

// Functional optics.
// https://github.com/gcanti/monocle-ts
export const childrenLens = Lens.fromProp<Element>()('children');
export const elementPrism = Prism.fromPredicate(isElement);
export const textPrism = Prism.fromPredicate(isText);
export const getChildAt = (index: number) => indexArray<Node>().index(index);

/**
 * Focus on Element by Path.
 */
// TODO: Maybe refactor to Optional<Element, Element> without as.
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
        const textTraversal = getTextTraversal(path as Path, index);
        if (textTraversal.asFold().getAll(element).length > 0)
          return textTraversal;
        return ensureTextTraversal(path as Path, element);
      },
    ),
  );

export const setTextElement = (
  text: string,
  selection: Selection,
): Endomorphism<Element> => element => {
  const onlyTextIsSelected: Predicate<Selection> = selection => {
    const anchorFold = ensureTextTraversal(selection.anchor, element).asFold();
    const focusFold = ensureTextTraversal(selection.focus, element).asFold();
    if (!anchorFold.exist(isText)(element)) return false;
    if (!focusFold.exist(isText)(element)) return false;
    return anchorFold.getAll(element)[0] === focusFold.getAll(element)[0];
  };

  if (isCollapsed(selection) || onlyTextIsSelected(selection)) {
    const path = selection.anchor;
    return ensureTextTraversal(path, element).set(text)(element);
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
