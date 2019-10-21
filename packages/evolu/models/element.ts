import { foldRight, init, last, unsafeUpdateAt } from 'fp-ts/lib/Array';
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
import { SetDOMNodePathRef } from './dom';
import { id, Node } from './node';
import { Path } from './path';
import { Range } from './range';
import { Selection, isCollapsedSelection } from './selection';
import { isText, Text, textIsBR } from './text';

/**
 * Element is the base model for all other editor elements.
 */
export interface Element extends Node {
  readonly children: (ElementChild)[];
}

export type ElementChild = Element | Text;

export type RenderElement = (
  element: Element,
  children: ReactNode,
  ref: SetDOMNodePathRef,
) => ReactNode;

export const isElement: Refinement<Node, Element> = (
  value,
): value is Element => {
  return Array.isArray((value as Element).children);
};

// Still not sure whether we really need ElementChild type.
export const elementChildIsElement: Refinement<ElementChild, Element> = (
  value,
): value is Element => isElement(value);

export const elementChildIsText: Refinement<ElementChild, Text> = (
  value,
): value is Text => isText(value);

export const elementChildIsTextNotBR: Refinement<ElementChild, Text> = (
  child,
): child is Text => {
  return isText(child) && !textIsBR(child);
};

export type TextWithOffset = {
  readonly text: Text;
  readonly offset: number;
};

export const isTextWithOffset: Refinement<
  MaterializedPath['to'],
  TextWithOffset
> = (value): value is TextWithOffset => {
  return typeof (value as TextWithOffset).offset === 'number';
};

export interface MaterializedPath {
  to: Element | Text | TextWithOffset;
  parents: Element[];
}

interface ReactElementFactory<T, P> extends Element {
  readonly tag: T;
  readonly props?: P;
  readonly children: (ReactElement | Text)[];
}

export type ReactElement = $Values<
  {
    [T in keyof ReactDOM]: ReactElementFactory<
      T,
      ReturnType<ReactDOM[T]>['props']
    >;
  }
>;

export function materializePath(
  path: Path,
): (element: Element) => Option<MaterializedPath> {
  return element => {
    const parents: MaterializedPath['parents'] = [];
    let to: MaterializedPath['to'] = element;
    for (let i = 0; i < path.length; i++) {
      const pathIndex = path[i];
      if (isElement(to)) {
        parents.push(to);
        to = to.children[pathIndex];
        if (to == null) return none;
      } else if (isText(to)) {
        const pathContinues = i < path.length - 1;
        if (pathContinues || pathIndex > to.text.length) return none;
        return some({ parents, to: { text: to, offset: pathIndex } });
      }
    }
    return some({ parents, to });
  };
}

/**
 * Map `<div>a</div>` to `{ id: id(), tag: 'div', children: [{ id: id(), text: 'a' }] }` etc.
 */
export function jsx(element: JSX.Element): ReactElement {
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
}

/**
 * Like https://developer.mozilla.org/en-US/docs/Web/API/Node/normalize,
 * except strings can be empty. Empty strings are rendered as BR.
 * If nothing has been normalized, the same element is returned.
 */
export const normalizeElement: Endomorphism<Element> = element => {
  // This flag is good enough for now. We can use fp-ts These later.
  let somethingHasBeenNormalized = false;
  const children = element.children.reduce<(ElementChild)[]>((array, child) => {
    if (isElement(child)) {
      const normalizedChild = normalizeElement(child);
      if (normalizedChild !== child) somethingHasBeenNormalized = true;
      return [...array, normalizedChild];
    }
    if (textIsBR(child)) return [...array, child];
    return pipe(
      last(array),
      chain(fromPredicate(elementChildIsTextNotBR)),
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

// TODO: Can we recursively remove ID from Element type?
export const recursiveRemoveID = (element: Element): any => {
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
      return recursiveRemoveID(child);
    }),
  };
};

/**
 * Focus on the children of Element.
 */
export const childrenLens = Lens.fromProp<Element>()('children');

/**
 * Focus on the child at index of ElementChild[].
 */
export function getElementChildAt(index: number) {
  return indexArray<ElementChild>().index(index);
}

/**
 * Focus on Element of ElementChild.
 */
export const elementPrism = Prism.fromPredicate(elementChildIsElement);

/**
 * Focus on Text of ElementChild.
 */
export const textPrism = Prism.fromPredicate(elementChildIsText);

/**
 * Focus on Element by Path.
 */
export function getElementTraversal(path: Path) {
  return path.reduce(
    (acc, pathIndex) => {
      return acc
        .composeLens(childrenLens)
        .composeOptional(getElementChildAt(pathIndex))
        .composePrism(elementPrism);
    },
    elementPrism.asOptional() as Optional<Element, Element>,
  );
}

/**
 * Focus on Text by Path.
 */
export function getTextTraversal(
  parentElementPath: Path,
  index: number,
): Optional<Element, Text> {
  return getElementTraversal(parentElementPath)
    .composeLens(childrenLens)
    .composeOptional(getElementChildAt(index))
    .composePrism(textPrism);
}

/**
 * Ensure text traversal. If Path focuses to text offset, get parent path.
 */
export function ensureTextTraversal(
  path: Path,
  element: Element,
): Optional<Element, Text> {
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
  selection: Selection,
): Endomorphism<Element> {
  return element => {
    const onlyTextIsSelected: Predicate<Selection> = selection => {
      const anchorFold = ensureTextTraversal(
        selection.anchor,
        element,
      ).asFold();
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
}

export function deleteContentElement(range: Range): Endomorphism<Element> {
  return element => {
    // TODO: Refactor all.
    const anchorMaterializedPath = toNullable(
      materializePath(range.start)(element),
    );
    const focusMaterializedPath = toNullable(
      materializePath(range.end)(element),
    );
    if (anchorMaterializedPath == null || focusMaterializedPath == null)
      return element;
    // TODO: Handle other cases, with lenses.
    if (
      // Just deleting text on the same texts.
      isTextWithOffset(anchorMaterializedPath.to) &&
      isTextWithOffset(focusMaterializedPath.to) &&
      anchorMaterializedPath.to.text === focusMaterializedPath.to.text
    ) {
      return pipe(
        init(range.start),
        fold(
          () => element,
          foldRight(
            () => element,
            (init, index) => {
              // @ts-ignore Refactor later.
              const startOffset = anchorMaterializedPath.to.offset;
              // @ts-ignore Refactor later.
              const endOffset = focusMaterializedPath.to.offset;
              return getTextTraversal(init, index).modify(t => {
                const text =
                  t.text.slice(0, startOffset) + t.text.slice(endOffset);
                return { ...t, text };
              })(element);
            },
          ),
        ),
      );
    }
    return element;
  };
}
