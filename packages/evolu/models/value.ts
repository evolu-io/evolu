import { Endomorphism, Refinement } from 'fp-ts/lib/function';
import { pipe } from 'fp-ts/lib/pipeable';
import { Lens } from 'monocle-ts';
import { createElement } from 'react';
import {
  deleteContentElement,
  Element,
  ReactElement,
  jsx,
  normalizeElement,
  setTextElement,
} from './element';
import {
  collapseSelectionToStart,
  Selection,
  eqSelection,
  moveSelection,
  mapSelectionToRange,
} from './selection';

/**
 * Use ValueWithoutSelection everywhere where Value must not have any selection.
 */
export interface ValueWithoutSelection {
  readonly element: Element;
  readonly hasFocus: boolean;
}

/**
 * Use ValueWithSelection everywhere where Value must have a selection.
 */
export interface ValueWithSelection {
  readonly element: Element;
  readonly hasFocus: boolean;
  readonly selection: Selection;
}

// Value is sum type.
// https://github.com/gcanti/fp-ts/issues/973#issuecomment-542185502
// https://dev.to/gcanti/functional-design-algebraic-data-types-36kf
// https://www.youtube.com/watch?v=PLFl95c-IiU

export type Value = ValueWithoutSelection | ValueWithSelection;

export const isValueWithSelection: Refinement<Value, ValueWithSelection> = (
  value,
): value is ValueWithSelection => {
  return (value as ValueWithSelection).selection != null;
};

export function createValue<T extends Element>({
  element,
  selection,
  hasFocus = false,
}: {
  element: T;
  selection?: Selection;
  hasFocus?: boolean;
}): Value {
  return { element, selection, hasFocus };
}

export function createValueWithText(text = '') {
  return createValue<ReactElement>({
    element: jsx(createElement('div', { className: 'root' }, text)),
    hasFocus: false,
  });
}

/**
 * Focus on the element of Value.
 */
export const elementLens = Lens.fromProp<Value>()('element');

export function select(
  selection: Selection,
): (value: Value) => ValueWithSelection {
  return value => {
    if (
      isValueWithSelection(value) &&
      eqSelection.equals(value.selection, selection)
    )
      return value;
    return { ...value, selection };
  };
}

export const setText = (
  text: string,
): Endomorphism<ValueWithSelection> => value =>
  pipe(
    value,
    elementLens.modify(setTextElement(text, value.selection)),
  ) as ValueWithSelection;

// TODO: It should traverse across nodes.
export const move = (
  offset: number,
): Endomorphism<ValueWithSelection> => value =>
  pipe(
    value,
    select(
      pipe(
        value.selection,
        moveSelection(offset),
      ),
    ),
  );

export const deleteContent: Endomorphism<ValueWithSelection> = value =>
  pipe(
    value,
    elementLens.modify(
      pipe(
        value.selection,
        mapSelectionToRange,
        deleteContentElement,
      ),
    ),
    select(collapseSelectionToStart(value.selection)),
  );

export const normalize: Endomorphism<Value> = value => {
  // https://github.com/gcanti/fp-ts/issues/976
  const element = normalizeElement(value.element);
  if (element === value.element) return value;
  return { ...value, element };
};
