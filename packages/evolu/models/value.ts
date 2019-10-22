import { Endomorphism } from 'fp-ts/lib/function';
import {
  exists,
  fold,
  map,
  none,
  Option,
  some,
  toNullable,
} from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import { Lens } from 'monocle-ts';
import { createElement } from 'react';
import {
  deleteContentElement,
  Element,
  jsx,
  normalizeElement,
  ReactElement,
  setTextElement,
} from './element';
import {
  collapseSelectionToStart,
  eqSelection,
  mapSelectionToRange,
  moveSelection,
  Selection,
} from './selection';

export interface Value {
  readonly element: Element;
  readonly hasFocus: boolean;
  readonly selection: Option<Selection>;
}

export const createValue = <T extends Element>({
  element,
  selection = none,
  hasFocus = false,
}: {
  element: T;
  selection?: Option<Selection>;
  hasFocus?: boolean;
}): Value => ({
  element,
  selection,
  hasFocus,
});

export const createValueWithText = (text = '') =>
  createValue<ReactElement>({
    element: jsx(createElement('div', { className: 'root' }, text)),
    hasFocus: false,
  });

/**
 * Focus on the element of Value.
 */
export const elementLens = Lens.fromProp<Value>()('element');

export const normalize: Endomorphism<Value> = value => {
  // https://github.com/gcanti/fp-ts/issues/976
  const element = normalizeElement(value.element);
  if (element === value.element) return value;
  return { ...value, element };
};

export const select = (selection: Selection): Endomorphism<Value> => value =>
  pipe(
    value.selection,
    exists(s => eqSelection.equals(s, selection)),
  )
    ? value
    : { ...value, selection: some(selection) };

export const setText = (text: string): Endomorphism<Value> => value => {
  const selection = toNullable(value.selection);
  if (selection == null) return value;
  return pipe(
    value,
    elementLens.modify(setTextElement(text, selection)),
  );
};

// TODO: It should traverse across nodes.
export const move = (offset: number): Endomorphism<Value> => value =>
  pipe(
    value.selection,
    map(moveSelection(offset)),
    fold(() => value, selection => select(selection)(value)),
  );

export const deleteContent: Endomorphism<Value> = value =>
  pipe(
    value.selection,
    fold(
      () => value,
      selection =>
        pipe(
          value,
          elementLens.modify(
            pipe(
              selection,
              mapSelectionToRange,
              deleteContentElement,
            ),
          ),
          select(collapseSelectionToStart(selection)),
        ),
    ),
  );
