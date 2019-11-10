import { getEq, last, unsafeUpdateAt } from 'fp-ts/lib/Array';
import { Eq, fromEquals, getStructEq, strictEqual } from 'fp-ts/lib/Eq';
import { Endomorphism, Predicate, Refinement } from 'fp-ts/lib/function';
import { IO } from 'fp-ts/lib/IO';
import { last as lastNonEmptyArray } from 'fp-ts/lib/NonEmptyArray';
import { pipe } from 'fp-ts/lib/pipeable';
import { Lens, Optional, Prism } from 'monocle-ts/lib';
import { indexArray } from 'monocle-ts/lib/Index/Array';
import nanoid from 'nanoid';
import { iso } from 'newtype-ts';
import { Children } from 'react';
import { fromPredicate, fold, chain } from 'fp-ts/lib/Option';
import {
  Element,
  ElementID,
  Node,
  NonEmptyPath,
  Path,
  ReactElement,
} from '../types';
import { initNonEmptyPath } from './path';
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
  const children = element.children.reduce<Node[]>((array, child) => {
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
export const getElementTraversal = (path: Path): Optional<Element, Element> =>
  path.reduce(
    (optional, pathIndex) =>
      optional
        .composeLens(childrenLens)
        .composeOptional(getChildAt(pathIndex))
        .composePrism(elementPrism),
    // As Optional<Element, Element> to enforce Element type.
    // Otherwise, type Node is inferred from elementPrism predicate.
    elementPrism.asOptional() as Optional<Element, Element>,
  );

/**
 * Focus on Text by Path.
 */
export const getTextTraversal = (
  path: NonEmptyPath,
): Optional<Element, string> =>
  getElementTraversal(initNonEmptyPath(path))
    .composeLens(childrenLens)
    .composeOptional(getChildAt(lastNonEmptyArray(path)))
    .composePrism(textPrism);

export const setTextElement = ({
  text,
  path,
}: {
  text: string;
  path: NonEmptyPath;
}): Endomorphism<Element> => element =>
  pipe(element, getTextTraversal(path).set(text));

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
